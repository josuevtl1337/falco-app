import cors from "cors";
import express from "express";
import ProductsRouter from "./routers/ProductsRouter.ts";
import ExpensesRouter from "./routers/ExpensesRouter.ts";
import CalibrationRouter from "./routers/CalibrationRouter.ts";
import MenuRouter from "./routers/MenuController.ts";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", ProductsRouter);
app.use("/api", ExpensesRouter);
app.use("/api", CalibrationRouter);
app.use("/api", MenuRouter );

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});

export default app;