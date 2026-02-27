import { Router } from "express";
import MenuController from "../controllers/MenuController.ts";

const MenuRouter = Router();
MenuRouter.get("/get-menu-items", MenuController.getAllMenuItems);
MenuRouter.post("/menu-items", MenuController.createMenuItem);
MenuRouter.put("/menu-items/:id", MenuController.updateMenuItem);
MenuRouter.delete("/menu-items/:id", MenuController.deleteMenuItem);
MenuRouter.post("/menu-items/bulk-update", MenuController.bulkUpdatePrices);
MenuRouter.get("/categories", MenuController.getCategories);

export default MenuRouter;
