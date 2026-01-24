import cors from "cors";
import express from "express";
import ProductsRouter from "./routers/ProductsRouter.ts";
import ExpensesRouter from "./routers/ExpensesRouter.ts";
import CalibrationRouter from "./routers/CalibrationRouter.ts";
import MenuRouter from "./routers/MenuRouter.ts";
import OrderRouter from "./routers/OrderRouter.ts";
import PrintRouter from "./routers/PrintRouter.ts";
import ShiftRouter from "./routers/ShiftRouter.ts";
import ReportRouter from "./routers/ReportRouter.ts";
import CostEngineRouter from "./routers/CostEngineRouter.ts";
import StockRouter from "./routers/StockRouter.ts";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", ProductsRouter);
app.use("/api", ExpensesRouter);
app.use("/api", CalibrationRouter);
app.use("/api", MenuRouter);
app.use("/api", OrderRouter);
app.use("/api", PrintRouter);
app.use("/api", ShiftRouter);
app.use("/api", ReportRouter);
app.use("/api", CostEngineRouter);
app.use("/api", StockRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});

export default app;