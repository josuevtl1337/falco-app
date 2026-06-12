import { Router } from "express";
import StockController from "../controllers/StockController.ts";
import VitrineStockController from "../controllers/VitrineStockController.ts";

const StockRouter = Router();


// Vitrine stock configuration (independent from stock_products)
StockRouter.get("/stock/vitrine-items", VitrineStockController.getAll);
StockRouter.post("/stock/vitrine-items", VitrineStockController.create);
StockRouter.put("/stock/vitrine-items/:id", VitrineStockController.update);
StockRouter.patch("/stock/vitrine-items/:id/active", VitrineStockController.toggleActive);
StockRouter.get("/stock/vitrine-items/:id/mappings", VitrineStockController.getMappings);
StockRouter.put("/stock/vitrine-items/:id/mappings", VitrineStockController.setMappings);

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

// Stock adjustment (set exact quantity)
StockRouter.patch("/stock/products/:id/adjust", StockController.adjustStock);

// Low stock alerts
StockRouter.get("/stock/alerts", StockController.getLowStockAlerts);

// Movement history
StockRouter.get("/stock/movements", StockController.getMovements);
StockRouter.get("/stock/products/:id/movements", StockController.getMovements);

export default StockRouter;
