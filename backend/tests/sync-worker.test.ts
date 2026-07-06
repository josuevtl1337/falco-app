import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { initializeSyncDatabase } from "../sync/migrations.ts";
import { SyncWorker } from "../sync/worker.ts";
import type { SyncConfig } from "../sync/config.ts";

const config: SyncConfig = {
  enabled: true,
  supabaseUrl: "https://example.supabase.co",
  publishableKey: "sb_publishable_test",
  deviceId: "00000000-0000-4000-8000-000000000010",
  deviceSecret: "a".repeat(64),
  intervalMs: 120_000,
  batchSize: 2,
  maxBatchesPerRun: 10,
  maxBatchBytes: 512 * 1024,
  timeoutMs: 15_000,
};

function createDatabase() {
  const db = new Database(":memory:");
  db.exec(
    "create table menu_items(id integer primary key, name text not null)",
  );
  initializeSyncDatabase(db);
  db.prepare("delete from sync_outbox").run();
  return db;
}

function enqueue(db: Database.Database, count: number) {
  const insert = db.prepare(`insert into sync_outbox
    (mutation_id,entity_type,entity_public_id,operation,payload,source_version)
    values(?, 'menu_items', ?, 'upsert', ?, 1)`);
  for (let index = 1; index <= count; index += 1) {
    const publicId = randomUUID();
    insert.run(
      randomUUID(),
      publicId,
      JSON.stringify({ id: index, public_id: publicId }),
    );
  }
}

test("drains multiple batches and acknowledges every accepted mutation", async () => {
  const db = createDatabase();
  enqueue(db, 5);
  let calls = 0;
  const fetchMock = (async (
    _input: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls += 1;
    const request = JSON.parse(String(init?.body));
    return Response.json({
      batch_id: request.batch_id,
      accepted: request.mutations.map(
        (mutation: { mutation_id: string }) => mutation.mutation_id,
      ),
      duplicates: [],
      rejected: [],
      server_time: new Date().toISOString(),
    });
  }) as typeof fetch;

  const worker = new SyncWorker(db, config, fetchMock);
  const status = await worker.runOnce();

  assert.equal(calls, 3);
  assert.equal(status.pending, 0);
  assert.equal(status.status, "synced");
  assert.equal(
    (
      db
        .prepare(
          "select count(*) count from sync_outbox where synced_at is not null",
        )
        .get() as { count: number }
    ).count,
    5,
  );
  db.close();
});

test("keeps failed mutations pending and schedules a retry", async () => {
  const db = createDatabase();
  enqueue(db, 1);
  const fetchMock = (async () =>
    new Response("temporary failure", { status: 503 })) as typeof fetch;
  const worker = new SyncWorker(db, config, fetchMock);

  const status = await worker.runOnce();
  const row = db
    .prepare("select attempt_count,next_attempt_at,synced_at from sync_outbox")
    .get() as {
    attempt_count: number;
    next_attempt_at: string;
    synced_at: string | null;
  };

  assert.equal(status.status, "error");
  assert.equal(status.pending, 1);
  assert.equal(row.attempt_count, 1);
  assert.ok(row.next_attempt_at);
  assert.equal(row.synced_at, null);
  db.close();
});

test("moves permanently rejected mutations to the dead-letter queue", async () => {
  const db = createDatabase();
  enqueue(db, 1);
  const mutationId = (
    db.prepare("select mutation_id from sync_outbox").get() as {
      mutation_id: string;
    }
  ).mutation_id;
  const fetchMock = (async (
    _input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const request = JSON.parse(String(init?.body));
    return Response.json({
      batch_id: request.batch_id,
      accepted: [],
      duplicates: [],
      rejected: [
        {
          mutation_id: mutationId,
          code: "invalid_payload",
          message: "Unsupported entity type",
          permanent: true,
        },
      ],
      server_time: new Date().toISOString(),
    });
  }) as typeof fetch;

  const worker = new SyncWorker(db, config, fetchMock);
  const status = await worker.runOnce();

  assert.equal(status.pending, 0);
  assert.equal(status.dead_letters, 1);
  assert.equal(
    (
      db.prepare("select count(*) count from sync_dead_letter").get() as {
        count: number;
      }
    ).count,
    1,
  );
  db.close();
});
