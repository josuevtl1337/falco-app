import { Router } from "express";
import MenuController from "../controllers/MenuController.ts";


const MenuRouter = Router();
MenuRouter.get("/get-menu-items", MenuController.getAllMenuItems);

export default MenuRouter;