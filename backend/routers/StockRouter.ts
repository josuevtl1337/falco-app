import { Router } from "express";
import StockController from "../controllers/StockController.ts";

const StockRouter = Router();

// Stock products CRUD
StockRouter.get("/stock/products", StockController.getAll);
StockRouter.get("/stock/products/:id", StockController.getById);
StockRouter.post("/stock/products", StockController.create);
StockRouter.put("/stock/products/:id", StockController.update);
StockRouter.patch("/stock/products/:id/active", StockController.toggleActive);

// Menu item mapping
StockRouter.get("/stock/products/:id/mappings", StockController.getMappings);
StockRouter.put("/stock/products/:id/mappings", StockController.setMappings);

// Replenishment
StockRouter.post("/stock/products/:id/replenish", StockController.replenish);

// Low stock alerts
StockRouter.get("/stock/alerts", StockController.getLowStockAlerts);

// Movement history
StockRouter.get("/stock/movements", StockController.getMovements);
StockRouter.get("/stock/products/:id/movements", StockController.getMovements);

export default StockRouter;
