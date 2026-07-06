import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type Database from "better-sqlite3";
import { replicatedTables } from "./entities.ts";

type Db = Database.Database;

function sqlUuid(): string {
  return `(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))),2) || '-' ||
    substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' ||
    lower(hex(randomblob(6))))`;
}

function jsonObject(columns: string[], prefix: "NEW" | "OLD"): string {
  return `json_object(${columns.flatMap((column) => [`'${column}'`, `${prefix}."${column}"`]).join(",")})`;
}

function installTableSync(db: Db, table: string): void {
  const exists = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  if (!exists) return;
  const columns = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{
    name: string;
  }>;
  if (!columns.some(({ name }) => name === "public_id")) {
    db.prepare(`ALTER TABLE "${table}" ADD COLUMN public_id TEXT`).run();
  }
  const rows = db
    .prepare(`SELECT rowid AS _rowid FROM "${table}" WHERE public_id IS NULL`)
    .all() as Array<{ _rowid: number }>;
  const assign = db.prepare(
    `UPDATE "${table}" SET public_id = ? WHERE rowid = ?`,
  );
  for (const row of rows) assign.run(randomUUID(), row._rowid);
  db.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS "idx_${table}_public_id" ON "${table}"(public_id)`,
  ).run();

  const currentColumns = db
    .prepare(`PRAGMA table_info("${table}")`)
    .all() as Array<{ name: string }>;
  const names = currentColumns.map(({ name }) => name);
  const uuid = sqlUuid();
  const newPayload = jsonObject(names, "NEW");
  const oldPayload = jsonObject(names, "OLD");

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS "sync_${table}_identity"
    AFTER INSERT ON "${table}" WHEN NEW.public_id IS NULL
    BEGIN
      UPDATE "${table}" SET public_id = ${uuid} WHERE rowid = NEW.rowid;
    END;

    CREATE TRIGGER IF NOT EXISTS "sync_${table}_insert"
    AFTER INSERT ON "${table}" WHEN NEW.public_id IS NOT NULL
    BEGIN
      INSERT INTO sync_outbox(mutation_id, entity_type, entity_public_id, operation, payload, source_version)
      VALUES (${uuid}, '${table}', NEW.public_id, 'upsert', ${newPayload}, 1);
    END;

    CREATE TRIGGER IF NOT EXISTS "sync_${table}_update"
    AFTER UPDATE ON "${table}" WHEN NEW.public_id IS NOT NULL
    BEGIN
      INSERT INTO sync_outbox(mutation_id, entity_type, entity_public_id, operation, payload, source_version)
      VALUES (${uuid}, '${table}', NEW.public_id, 'upsert', ${newPayload},
        COALESCE((SELECT MAX(source_version) + 1 FROM sync_outbox WHERE entity_type='${table}' AND entity_public_id=NEW.public_id), 1));
    END;

    CREATE TRIGGER IF NOT EXISTS "sync_${table}_delete"
    AFTER DELETE ON "${table}" WHEN OLD.public_id IS NOT NULL
    BEGIN
      INSERT INTO sync_outbox(mutation_id, entity_type, entity_public_id, operation, payload, source_version)
      VALUES (${uuid}, '${table}', OLD.public_id, 'delete', ${oldPayload},
        COALESCE((SELECT MAX(source_version) + 1 FROM sync_outbox WHERE entity_type='${table}' AND entity_public_id=OLD.public_id), 1));
    END;
  `);
}

function enqueueHistoricalBackfill(db: Db): void {
  const insert = db.prepare(`INSERT OR IGNORE INTO sync_outbox
    (mutation_id,entity_type,entity_public_id,operation,payload,source_version)
    VALUES(?,?,?,'upsert',?,1)`);
  const already = db.prepare(`SELECT 1 FROM sync_outbox
    WHERE entity_type=? AND entity_public_id=? AND source_version=1 LIMIT 1`);

  for (const table of replicatedTables) {
    if (
      !db
        .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
        .get(table)
    )
      continue;
    const rows = db
      .prepare(`SELECT * FROM "${table}" WHERE public_id IS NOT NULL`)
      .all() as Array<Record<string, unknown>>;
    for (const row of rows) {
      if (!already.get(table, row.public_id))
        insert.run(randomUUID(), table, row.public_id, JSON.stringify(row));
    }
  }
}

function refreshSyncTriggers(db: Db): void {
  for (const table of replicatedTables) {
    db.exec(`
      DROP TRIGGER IF EXISTS "sync_${table}_identity";
      DROP TRIGGER IF EXISTS "sync_${table}_insert";
      DROP TRIGGER IF EXISTS "sync_${table}_update";
      DROP TRIGGER IF EXISTS "sync_${table}_delete";
    `);
    installTableSync(db, table);
  }
}

export function initializeSyncDatabase(db: Db): void {
  const hasMigrationTable = Boolean(
    db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
      )
      .get(),
  );
  const firstMigrationApplied =
    hasMigrationTable &&
    Boolean(
      db.prepare("SELECT 1 FROM schema_migrations WHERE version=1").get(),
    );
  const databasePath = db.name;

  // The first backup must precede every schema mutation so it remains a pristine rollback point.
  if (!firstMigrationApplied && databasePath && databasePath !== ":memory:") {
    const backupDir = join(dirname(databasePath), "backups");
    mkdirSync(backupDir, { recursive: true });
    copyFileSync(
      databasePath,
      join(
        backupDir,
        `pre-sync-${new Date().toISOString().replace(/:/g, "-")}.db`,
      ),
    );
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sync_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mutation_id TEXT NOT NULL UNIQUE,
      entity_type TEXT NOT NULL,
      entity_public_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('upsert','delete')),
      payload TEXT NOT NULL,
      source_version INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT,
      synced_at TEXT,
      last_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending ON sync_outbox(synced_at, next_attempt_at, id);
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sync_dead_letter (
      mutation_id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_public_id TEXT NOT NULL,
      payload TEXT NOT NULL, error_code TEXT NOT NULL, error_message TEXT NOT NULL,
      failed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  if (!firstMigrationApplied)
    db.transaction(() => {
      refreshSyncTriggers(db);
      enqueueHistoricalBackfill(db);
      db.prepare("INSERT INTO schema_migrations(version,name) VALUES(1,?)").run(
        "sync_outbox_public_ids_and_triggers",
      );
    })();

  // Version 6 repairs databases touched by an intermediate development build. It is a no-op
  // for clean installs except for recording the hardened migration level.
  if (!db.prepare("SELECT 1 FROM schema_migrations WHERE version=6").get())
    db.transaction(() => {
      refreshSyncTriggers(db);
      enqueueHistoricalBackfill(db);
      db.exec(`DELETE FROM sync_outbox WHERE id NOT IN (
      SELECT MIN(id) FROM sync_outbox GROUP BY entity_type,entity_public_id,source_version,operation
    )`);
      db.prepare("INSERT INTO schema_migrations(version,name) VALUES(6,?)").run(
        "harden_idempotent_backfill",
      );
    })();

  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_outbox_entity_version
    ON sync_outbox(entity_type,entity_public_id,source_version,operation)`);
}
