function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const syncConfig = {
  enabled: process.env.FALCO_SYNC_ENABLED === "true",
  supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "",
  publishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
  deviceId: process.env.FALCO_DEVICE_ID ?? "",
  deviceSecret: process.env.FALCO_DEVICE_SECRET ?? "",
  intervalMs: positiveNumber(process.env.FALCO_SYNC_INTERVAL_MS, 120_000),
  batchSize: Math.min(
    positiveNumber(process.env.FALCO_SYNC_BATCH_SIZE, 200),
    200,
  ),
  maxBatchesPerRun: Math.min(
    positiveNumber(process.env.FALCO_SYNC_MAX_BATCHES_PER_RUN, 10),
    50,
  ),
  maxBatchBytes: 512 * 1024,
  timeoutMs: 15_000,
};

export type SyncConfig = typeof syncConfig;

export function validateSyncConfig(): string[] {
  if (!syncConfig.enabled) return [];
  return (
    [
      ["SUPABASE_URL", syncConfig.supabaseUrl],
      ["SUPABASE_PUBLISHABLE_KEY", syncConfig.publishableKey],
      ["FALCO_DEVICE_ID", syncConfig.deviceId],
      ["FALCO_DEVICE_SECRET", syncConfig.deviceSecret],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);
}
