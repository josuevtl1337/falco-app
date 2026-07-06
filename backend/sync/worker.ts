import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { syncPushResponseSchema, type SyncMutation } from "@falco/contracts";
import { syncConfig, validateSyncConfig, type SyncConfig } from "./config.ts";
import { entityPriorities } from "./entities.ts";

type Db = Database.Database;
type OutboxRow = {
  mutation_id: string;
  entity_type: string;
  entity_public_id: string;
  operation: "upsert" | "delete";
  payload: string;
  source_version: number;
  created_at: string;
  attempt_count: number;
};

const retryDelays = [30, 120, 600, 1800, 3600];

export class SyncWorker {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly db: Db,
    private readonly config: SyncConfig = syncConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  start(): void {
    if (!this.config.enabled) {
      this.setState("status", "disabled");
      return;
    }
    const missing =
      this.config === syncConfig ? validateSyncConfig() : this.validateConfig();
    if (missing.length) {
      this.setState("status", "configuration_error");
      this.setState("last_error", `Missing: ${missing.join(", ")}`);
      return;
    }
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), this.config.intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  status() {
    const state = Object.fromEntries(
      (
        this.db.prepare("SELECT key,value FROM sync_state").all() as Array<{
          key: string;
          value: string;
        }>
      ).map((r) => [r.key, r.value]),
    );
    const pending = (
      this.db
        .prepare(
          "SELECT COUNT(*) count FROM sync_outbox WHERE synced_at IS NULL",
        )
        .get() as { count: number }
    ).count;
    const deadLetters = (
      this.db.prepare("SELECT COUNT(*) count FROM sync_dead_letter").get() as {
        count: number;
      }
    ).count;
    return {
      ...state,
      status: state.status,
      enabled: this.config.enabled,
      running: this.running,
      pending,
      dead_letters: deadLetters,
    };
  }

  async runOnce(): Promise<ReturnType<SyncWorker["status"]>> {
    if (!this.config.enabled || this.running) return this.status();
    this.running = true;
    this.setState("status", "syncing");
    try {
      let batchCount = 0;
      while (batchCount < this.config.maxBatchesPerRun) {
        const rows = this.selectBatch();
        if (!rows.length) break;
        await this.push(rows);
        batchCount += 1;
      }
      const pending = Number(this.status().pending) > 0;
      this.setState("status", pending ? "pending" : "synced");
      this.setState("last_success_at", new Date().toISOString());
      this.setState("last_batch_count", String(batchCount));
      this.setState("consecutive_failures", "0");
      if (pending) {
        const continuation = setTimeout(() => void this.runOnce(), 1_000);
        continuation.unref();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setState("status", message.includes("fetch") ? "offline" : "error");
      this.setState("last_error", message.slice(0, 500));
      const failures = Number(this.getState("consecutive_failures") ?? 0) + 1;
      this.setState("consecutive_failures", String(failures));
    } finally {
      this.running = false;
    }
    return this.status();
  }

  private selectBatch(): OutboxRow[] {
    const candidates = this.db
      .prepare(
        `SELECT * FROM sync_outbox
      WHERE synced_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      ORDER BY id LIMIT ?`,
      )
      .all(this.config.batchSize * 2) as OutboxRow[];
    candidates.sort(
      (a, b) =>
        (entityPriorities[a.entity_type] ?? 999) -
        (entityPriorities[b.entity_type] ?? 999),
    );
    const selected: OutboxRow[] = [];
    let bytes = 0;
    for (const row of candidates) {
      const size = Buffer.byteLength(row.payload) + 300;
      if (selected.length && bytes + size > this.config.maxBatchBytes) break;
      selected.push(row);
      bytes += size;
      if (selected.length >= this.config.batchSize) break;
    }
    return selected;
  }

  private async push(rows: OutboxRow[]): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const mutations: SyncMutation[] = rows.map((row) => ({
      mutation_id: row.mutation_id,
      entity_type: row.entity_type,
      entity_public_id: row.entity_public_id,
      operation: row.operation,
      source_version: row.source_version,
      occurred_at: row.created_at,
      payload: JSON.parse(row.payload) as Record<string, unknown>,
    }));
    try {
      const response = await this.fetchImpl(
        `${this.config.supabaseUrl}/functions/v1/sync-push`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            apikey: this.config.publishableKey,
            "x-device-id": this.config.deviceId,
            "x-device-secret": this.config.deviceSecret,
          },
          body: JSON.stringify({
            protocol_version: "v1",
            device_id: this.config.deviceId,
            batch_id: randomUUID(),
            mutations,
          }),
        },
      );
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 200);
        throw new Error(
          `Sync endpoint returned ${response.status}${detail ? `: ${detail}` : ""}`,
        );
      }
      const result = syncPushResponseSchema.parse(await response.json());
      this.db.transaction(() => {
        const mark = this.db.prepare(
          "UPDATE sync_outbox SET synced_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),last_error=NULL WHERE mutation_id=?",
        );
        for (const id of [...result.accepted, ...result.duplicates])
          mark.run(id);
        for (const rejected of result.rejected)
          this.reject(
            rejected.mutation_id,
            rejected.code,
            rejected.message,
            rejected.permanent,
          );
      })();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.db.transaction(() => {
        for (const row of rows) this.retry(row, message);
      })();
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private retry(row: OutboxRow, message: string): void {
    const attempt = row.attempt_count + 1;
    const base = retryDelays[Math.min(attempt - 1, retryDelays.length - 1)]!;
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    this.db
      .prepare(
        `UPDATE sync_outbox SET attempt_count=?, last_error=?,
      next_attempt_at=strftime('%Y-%m-%dT%H:%M:%fZ','now',?) WHERE mutation_id=?`,
      )
      .run(
        attempt,
        message.slice(0, 500),
        `+${delay} seconds`,
        row.mutation_id,
      );
  }

  private reject(
    id: string,
    code: string,
    message: string,
    permanent: boolean,
  ): void {
    if (!permanent) {
      const row = this.db
        .prepare("SELECT * FROM sync_outbox WHERE mutation_id=?")
        .get(id) as OutboxRow | undefined;
      if (row) this.retry(row, `${code}: ${message}`);
      return;
    }
    this.db
      .prepare(
        `INSERT OR REPLACE INTO sync_dead_letter
      SELECT mutation_id,entity_type,entity_public_id,payload,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM sync_outbox WHERE mutation_id=?`,
      )
      .run(code, message.slice(0, 500), id);
    this.db
      .prepare(
        "UPDATE sync_outbox SET synced_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),last_error=? WHERE mutation_id=?",
      )
      .run(`${code}: ${message}`, id);
  }

  private setState(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO sync_state(key,value,updated_at) VALUES(?,?,datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`,
      )
      .run(key, value);
  }
  private getState(key: string): string | undefined {
    return (
      this.db.prepare("SELECT value FROM sync_state WHERE key=?").get(key) as
        | { value: string }
        | undefined
    )?.value;
  }
  private validateConfig(): string[] {
    return (
      [
        ["SUPABASE_URL", this.config.supabaseUrl],
        ["SUPABASE_PUBLISHABLE_KEY", this.config.publishableKey],
        ["FALCO_DEVICE_ID", this.config.deviceId],
        ["FALCO_DEVICE_SECRET", this.config.deviceSecret],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name);
  }
}
