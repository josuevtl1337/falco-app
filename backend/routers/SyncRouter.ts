import { Router } from "express";
import type { SyncWorker } from "../sync/worker.ts";

export function createSyncRouter(worker: SyncWorker) {
  const router = Router();
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://tauri.localhost",
    "https://tauri.localhost",
    "tauri://localhost",
  ]);
  router.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: "Local sync endpoint" });
      return;
    }
    next();
  });
  router.get("/sync/status", (_req, res) => res.json(worker.status()));
  router.post("/sync/run", async (_req, res) =>
    res.json(await worker.runOnce()),
  );
  return router;
}
