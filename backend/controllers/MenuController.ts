import type { Response, Request } from "express";
import MenuModel from "../models/MenuModel.ts";
import type { IMenuItem } from "../models/MenuModel.ts";

class MenuController {
  public async getAllMenuItems(req: Request, res: Response): Promise<void> {
    try {
      const menu = await MenuModel.getAllMenuItems();
      res.status(200).json(menu);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  }

  public async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const { slug, name, description, price, category_id, is_active } =
        req.body;

      if (!name || !price || !category_id) {
        res
          .status(400)
          .json({ error: "Name, price, and category_id are required" });
        return;
      }

      const id = await MenuModel.createMenuItem({
        slug: slug || null,
        name,
        description: description || null,
        price: Number(price),
        category_id,
        is_active: is_active !== undefined ? Number(is_active) : 1,
      });

      const newItem = await MenuModel.getMenuItemById(id.toString());
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ error: "Failed to create menu item" });
    }
  }

  public async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { slug, name, description, price, category_id, is_active } =
        req.body;

      if (!id) {
        res.status(400).json({ error: "ID is required" });
        return;
      }

      const updateData: Partial<
        Omit<IMenuItem, "id" | "created_at" | "updated_at">
      > = {};

      if (slug !== undefined) updateData.slug = slug;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (category_id !== undefined) updateData.category_id = category_id;
      if (is_active !== undefined) updateData.is_active = Number(is_active);

      const updated = await MenuModel.updateMenuItem(id, updateData);

      if (!updated) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }

      const updatedItem = await MenuModel.getMenuItemById(id);
      res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ error: "Failed to update menu item" });
    }
  }

  public async deleteMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "ID is required" });
        return;
      }

      const deleted = await MenuModel.deleteMenuItem(id);

      if (!deleted) {
        res.status(404).json({ error: "Menu item not found" });
        return;
      }

      res.status(200).json({ message: "Menu item deleted successfully" });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  }

  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await MenuModel.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  public async bulkUpdatePrices(req: Request, res: Response): Promise<void> {
    try {
      const { categoryIds, operation, value } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        res.status(400).json({ error: "categoryIds array is required" });
        return;
      }

      if (!operation || !value === undefined) {
        res.status(400).json({ error: "operation and value are required" });
        return;
      }

      const validOperations = [
        "pct_increase",
        "pct_decrease",
        "fixed_amount_increase",
        "fixed_amount_decrease",
        "fixed_price",
      ];

      if (!validOperations.includes(operation)) {
        res.status(400).json({ error: "Invalid operation" });
        return;
      }

      const changes = await MenuModel.bulkUpdatePrices(
        categoryIds,
        operation as any,
        Number(value),
      );

      res.status(200).json({ message: "Prices updated successfully", changes });
    } catch (error) {
      console.error("Error bulk updating prices:", error);
      res.status(500).json({ error: "Failed to update prices" });
    }
  }
}

export default new MenuController();
