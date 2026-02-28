import cors from "cors";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import CalibrationRouter from "./routers/CalibrationRouter.ts";
import MenuRouter from "./routers/MenuRouter.ts";
import OrderRouter from "./routers/OrderRouter.ts";
import PrintRouter from "./routers/PrintRouter.ts";
import ShiftRouter from "./routers/ShiftRouter.ts";
import ReportRouter from "./routers/ReportRouter.ts";
import CostEngineRouter from "./routers/CostEngineRouter.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", CalibrationRouter);
app.use("/api", MenuRouter);
app.use("/api", OrderRouter);
app.use("/api", PrintRouter);
app.use("/api", ShiftRouter);
app.use("/api", ReportRouter);
app.use("/api", CostEngineRouter);

// Serve frontend static files in production
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});

export default app;