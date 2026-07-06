import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { initializeSyncDatabase } from "../sync/migrations.ts";
test("backfills UUIDs and captures insert, update and delete exactly once", () => {
  const db = new Database(":memory:");
  db.exec(
    "create table menu_items(id integer primary key autoincrement,name text not null,price integer not null)",
  );
  db.prepare("insert into menu_items(name,price) values('Espresso',100)").run();
  initializeSyncDatabase(db);
  assert.match(
    (
      db.prepare("select public_id from menu_items where id=1").get() as {
        public_id: string;
      }
    ).public_id,
    /^[0-9a-f-]{36}$/,
  );
  const before = (
    db.prepare("select count(*) c from sync_outbox").get() as { c: number }
  ).c;
  db.prepare("insert into menu_items(name,price) values('Latte',200)").run();
  assert.equal(
    (db.prepare("select count(*) c from sync_outbox").get() as { c: number }).c,
    before + 1,
  );
  db.prepare("update menu_items set price=250 where id=2").run();
  db.prepare("delete from menu_items where id=2").run();
  const afterMutations = (
    db.prepare("select count(*) c from sync_outbox").get() as { c: number }
  ).c;
  assert.equal(afterMutations, before + 3);

  initializeSyncDatabase(db);
  assert.equal(
    (db.prepare("select count(*) c from sync_outbox").get() as { c: number }).c,
    afterMutations,
  );
  assert.deepEqual(
    (
      db
        .prepare("select version from schema_migrations order by version")
        .all() as Array<{
        version: number;
      }>
    ).map(({ version }) => version),
    [1, 6],
  );
});
