import type { Response, Request } from "express";
import CostProductsModel from "../models/CostProductsModel.ts";

class CostProductsController {
  /**
   * GET /api/cost-engine/products
   * Obtiene todos los productos de costo
   */
  public async getAllCostProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = CostProductsModel.getAllCostProducts();
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching cost products:", error);
      res.status(500).json({ error: "Failed to fetch cost products" });
    }
  }

  /**
   * GET /api/cost-engine/products/:id
   * Obtiene un producto por ID
   */
  public async getCostProductById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const product = CostProductsModel.getCostProductById(id);

      if (!product) {
        res.status(404).json({ error: "Cost product not found" });
        return;
      }

      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching cost product:", error);
      res.status(500).json({ error: "Failed to fetch cost product" });
    }
  }

  /**
   * POST /api/cost-engine/products
   * Crea un nuevo producto de costo
   */
  public async createCostProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = req.body;
      const result = CostProductsModel.createCostProduct(product);
      const createdProduct = CostProductsModel.getCostProductById(result.lastInsertRowid);
      res.status(201).json(createdProduct);
    } catch (error) {
      console.error("Error creating cost product:", error);
      res.status(500).json({ error: "Failed to create cost product" });
    }
  }

  /**
   * PUT /api/cost-engine/products/:id
   * Actualiza un producto de costo
   */
  public async updateCostProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const product = req.body;

      const updated = CostProductsModel.updateCostProduct(id, product);

      if (!updated) {
        res.status(404).json({ error: "Cost product not found" });
        return;
      }

      const updatedProduct = CostProductsModel.getCostProductById(id);
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Error updating cost product:", error);
      res.status(500).json({ error: "Failed to update cost product" });
    }
  }

  /**
   * POST /api/cost-engine/products/:id/recalculate
   * Recalcula manualmente el precio de un producto
   */
  public async recalculateProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const recalculated = CostProductsModel.recalculateProductPrice(id);

      if (!recalculated) {
        res.status(404).json({ error: "Cost product not found" });
        return;
      }

      const updatedProduct = CostProductsModel.getCostProductById(id);
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Error recalculating product:", error);
      res.status(500).json({ error: "Failed to recalculate product" });
    }
  }

  /**
   * DELETE /api/cost-engine/products/:id
   * Elimina (desactiva) un producto de costo
   */
  public async deleteCostProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = CostProductsModel.deleteCostProduct(id);

      if (!deleted) {
        res.status(404).json({ error: "Cost product not found" });
        return;
      }

      res.status(200).json({ message: "Cost product deleted successfully" });
    } catch (error) {
      console.error("Error deleting cost product:", error);
      res.status(500).json({ error: "Failed to delete cost product" });
    }
  }
}

export default new CostProductsController();
