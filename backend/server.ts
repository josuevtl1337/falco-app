import "dotenv/config";
import cors from "cors";
import express from "express";
import CalibrationRouter from "./routers/CalibrationRouter.ts";
import MenuRouter from "./routers/MenuRouter.ts";
import OrderRouter from "./routers/OrderRouter.ts";
import PrintRouter from "./routers/PrintRouter.ts";
import ShiftRouter from "./routers/ShiftRouter.ts";
import ReportRouter from "./routers/ReportRouter.ts";
import CostEngineRouter from "./routers/CostEngineRouter.ts";
import StockRouter from "./routers/StockRouter.ts";
import CashRegisterRouter from "./routers/CashRegisterRouter.ts";
import ServiceRouter from "./routers/ServiceRouter.ts";
import CustomerRouter from "./routers/CustomerRouter.ts";
import db from "./db.ts";
import { AdminRequestWorker } from "./sync/admin-requests.ts";
import { SyncWorker } from "./sync/worker.ts";
import { createSyncRouter } from "./routers/SyncRouter.ts";

const app = express();
const syncWorker = new SyncWorker(db);
const adminRequestWorker = new AdminRequestWorker(db);
app.use(cors());
app.use(express.json());
app.set("etag", false);
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api", CalibrationRouter);
app.use("/api", MenuRouter);
app.use("/api", OrderRouter);
app.use("/api", PrintRouter);
app.use("/api", ShiftRouter);
app.use("/api", ReportRouter);
app.use("/api", CostEngineRouter);
app.use("/api", StockRouter);
app.use("/api", CashRegisterRouter);
app.use("/api", ServiceRouter);
app.use("/api", CustomerRouter);
app.use("/api", createSyncRouter(syncWorker));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
syncWorker.start();
adminRequestWorker.start();

export default app;
