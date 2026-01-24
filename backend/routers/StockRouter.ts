import { Router } from "express";
import StockController from "../controllers/StockController.ts";

const StockRouter = Router();

// Stock endpoints
StockRouter.get("/stock", StockController.getAllStock);
StockRouter.get("/stock/low", StockController.getLowStock);
StockRouter.get("/stock/:id", StockController.getStockById);
StockRouter.put("/stock/:id", StockController.updateStock);
StockRouter.post("/stock/:id/add", StockController.addStock);
StockRouter.post("/stock/validate", StockController.validateStock);

// Menu Item Recipes endpoints
StockRouter.get("/stock/menu-item-recipes", StockController.getAllMenuItemRecipes);
StockRouter.get("/stock/menu-item-recipes/:menuItemId", StockController.getMenuItemIngredients);
StockRouter.put("/stock/menu-item-recipes/:menuItemId", StockController.setMenuItemIngredients);

export default StockRouter;
