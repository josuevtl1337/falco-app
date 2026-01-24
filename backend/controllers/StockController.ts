import StockModel from "../models/StockModel.ts";
import type { Response, Request } from "express";

class StockController {
    /**
     * GET /api/stock
     * Obtiene todos los insumos con su stock actual
     */
    public async getAllStock(_req: Request, res: Response) {
        try {
            const stock = StockModel.getAllStock();
            res.json(stock);
        } catch (error: any) {
            console.error("Error getting stock:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * GET /api/stock/low
     * Obtiene items con bajo stock
     */
    public async getLowStock(_req: Request, res: Response) {
        try {
            const lowStock = StockModel.getLowStockItems();
            res.json(lowStock);
        } catch (error: any) {
            console.error("Error getting low stock:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * GET /api/stock/:id
     * Obtiene el stock de un insumo específico
     */
    public async getStockById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const stock = StockModel.getStockById(id);
            if (!stock) {
                return res.status(404).json({ error: "Stock item not found" });
            }
            res.json(stock);
        } catch (error: any) {
            console.error("Error getting stock by id:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * PUT /api/stock/:id
     * Actualiza el stock de un insumo
     */
    public async updateStock(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const payload = req.body && req.body.body ? req.body.body : req.body;
            const { stock_quantity, min_stock } = payload;

            const success = StockModel.updateStock(id, stock_quantity, min_stock);
            if (!success) {
                return res.status(404).json({ error: "Stock item not found" });
            }

            const updated = StockModel.getStockById(id);
            res.json({ success: true, stock: updated });
        } catch (error: any) {
            console.error("Error updating stock:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * POST /api/stock/:id/add
     * Agrega stock a un insumo
     */
    public async addStock(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const payload = req.body && req.body.body ? req.body.body : req.body;
            const { quantity, notes } = payload;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({ error: "Quantity must be positive" });
            }

            const success = StockModel.addStock(id, quantity, notes);
            if (!success) {
                return res.status(404).json({ error: "Stock item not found" });
            }

            const updated = StockModel.getStockById(id);
            res.json({ success: true, stock: updated });
        } catch (error: any) {
            console.error("Error adding stock:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * POST /api/stock/validate
     * Valida si hay stock suficiente para una orden
     */
    public async validateStock(req: Request, res: Response) {
        try {
            const payload = req.body && req.body.body ? req.body.body : req.body;
            const { items } = payload;

            if (!items || !Array.isArray(items)) {
                return res.status(400).json({ error: "Items array is required" });
            }

            const result = StockModel.validateStockForOrder(items);
            res.json(result);
        } catch (error: any) {
            console.error("Error validating stock:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * GET /api/stock/menu-item-recipes
     * Obtiene todas las recetas de items del menú
     */
    public async getAllMenuItemRecipes(_req: Request, res: Response) {
        try {
            const recipes = StockModel.getAllMenuItemRecipes();
            res.json(recipes);
        } catch (error: any) {
            console.error("Error getting menu item recipes:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * GET /api/stock/menu-item-recipes/:menuItemId
     * Obtiene los ingredientes de un item del menú
     */
    public async getMenuItemIngredients(req: Request, res: Response) {
        try {
            const menuItemId = parseInt(req.params.menuItemId);
            const ingredients = StockModel.getMenuItemIngredients(menuItemId);
            res.json(ingredients);
        } catch (error: any) {
            console.error("Error getting menu item ingredients:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }

    /**
     * PUT /api/stock/menu-item-recipes/:menuItemId
     * Define o actualiza los ingredientes de un item del menú
     */
    public async setMenuItemIngredients(req: Request, res: Response) {
        try {
            const menuItemId = parseInt(req.params.menuItemId);
            const payload = req.body && req.body.body ? req.body.body : req.body;
            const { ingredients } = payload;

            if (!Array.isArray(ingredients)) {
                return res.status(400).json({ error: "Ingredients array is required" });
            }

            StockModel.setMenuItemIngredients(menuItemId, ingredients);
            const updated = StockModel.getMenuItemIngredients(menuItemId);
            res.json({ success: true, ingredients: updated });
        } catch (error: any) {
            console.error("Error setting menu item ingredients:", error);
            return res.status(500).json({
                success: false,
                message: error?.message || "Internal server error",
            });
        }
    }
}

export default new StockController();
