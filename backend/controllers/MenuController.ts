import type { Response, Request } from "express";
import MenuModel from "../models/MenuModel.ts";

class MenuController {

  public async getAllMenuItems(req: Request, res: Response): Promise<void> {
    try {
      const menu = await MenuModel.getAllMenuItems();
      res.status(200).json(menu);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  }
}

export default new MenuController();

