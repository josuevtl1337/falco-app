import type { Response, Request } from "express";
import FixedCostsModel from "../models/FixedCostsModel.ts";

class FixedCostsController {
  /**
   * GET /api/cost-engine/fixed-costs
   * Obtiene todos los gastos fijos
   */
  public async getAllFixedCosts(req: Request, res: Response): Promise<void> {
    try {
      const fixedCosts = FixedCostsModel.getAllFixedCosts();
      res.status(200).json(fixedCosts);
    } catch (error) {
      console.error("Error fetching fixed costs:", error);
      res.status(500).json({ error: "Failed to fetch fixed costs" });
    }
  }

  /**
   * GET /api/cost-engine/fixed-costs/global
   * Obtiene solo los gastos fijos globales
   */
  public async getGlobalFixedCosts(req: Request, res: Response): Promise<void> {
    try {
      const fixedCosts = FixedCostsModel.getGlobalFixedCosts();
      res.status(200).json(fixedCosts);
    } catch (error) {
      console.error("Error fetching global fixed costs:", error);
      res.status(500).json({ error: "Failed to fetch global fixed costs" });
    }
  }

  /**
   * GET /api/cost-engine/fixed-costs/product/:productId
   * Obtiene los gastos fijos de un producto específico
   */
  public async getProductFixedCosts(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.productId);
      const fixedCosts = FixedCostsModel.getProductFixedCosts(productId);
      res.status(200).json(fixedCosts);
    } catch (error) {
      console.error("Error fetching product fixed costs:", error);
      res.status(500).json({ error: "Failed to fetch product fixed costs" });
    }
  }

  /**
   * GET /api/cost-engine/fixed-costs/:id
   * Obtiene un gasto fijo por ID
   */
  public async getFixedCostById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const fixedCost = FixedCostsModel.getFixedCostById(id);

      if (!fixedCost) {
        res.status(404).json({ error: "Fixed cost not found" });
        return;
      }

      res.status(200).json(fixedCost);
    } catch (error) {
      console.error("Error fetching fixed cost:", error);
      res.status(500).json({ error: "Failed to fetch fixed cost" });
    }
  }

  /**
   * POST /api/cost-engine/fixed-costs
   * Crea un nuevo gasto fijo
   */
  public async createFixedCost(req: Request, res: Response): Promise<void> {
    try {
      const fixedCost = req.body;
      const result = FixedCostsModel.createFixedCost(fixedCost);
      const created = FixedCostsModel.getFixedCostById(result.lastInsertRowid);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating fixed cost:", error);
      res.status(500).json({ error: "Failed to create fixed cost" });
    }
  }

  /**
   * PUT /api/cost-engine/fixed-costs/:id
   * Actualiza un gasto fijo
   */
  public async updateFixedCost(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const fixedCost = req.body;

      const updated = FixedCostsModel.updateFixedCost(id, fixedCost);

      if (!updated) {
        res.status(404).json({ error: "Fixed cost not found" });
        return;
      }

      const updatedFixedCost = FixedCostsModel.getFixedCostById(id);
      res.status(200).json(updatedFixedCost);
    } catch (error) {
      console.error("Error updating fixed cost:", error);
      res.status(500).json({ error: "Failed to update fixed cost" });
    }
  }

  /**
   * DELETE /api/cost-engine/fixed-costs/:id
   * Elimina (desactiva) un gasto fijo
   */
  public async deleteFixedCost(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = FixedCostsModel.deleteFixedCost(id);

      if (!deleted) {
        res.status(404).json({ error: "Fixed cost not found" });
        return;
      }

      res.status(200).json({ message: "Fixed cost deleted successfully" });
    } catch (error) {
      console.error("Error deleting fixed cost:", error);
      res.status(500).json({ error: "Failed to delete fixed cost" });
    }
  }
}

export default new FixedCostsController();
