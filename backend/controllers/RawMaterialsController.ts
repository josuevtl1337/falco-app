import type { Response, Request } from "express";
import RawMaterialsModel from "../models/RawMaterialsModel.ts";
import RecipesModel from "../models/RecipesModel.ts";
import CostProductsModel from "../models/CostProductsModel.ts";

class RawMaterialsController {
  /**
   * GET /api/cost-engine/raw-materials
   * Obtiene todas las materias primas
   */
  public async getAllRawMaterials(req: Request, res: Response): Promise<void> {
    try {
      const materials = RawMaterialsModel.getAllRawMaterials();
      res.status(200).json(materials);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      res.status(500).json({ error: "Failed to fetch raw materials" });
    }
  }

  /**
   * GET /api/cost-engine/raw-materials/:id
   * Obtiene una materia prima por ID
   */
  public async getRawMaterialById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const material = RawMaterialsModel.getRawMaterialById(id);

      if (!material) {
        res.status(404).json({ error: "Raw material not found" });
        return;
      }

      res.status(200).json(material);
    } catch (error) {
      console.error("Error fetching raw material:", error);
      res.status(500).json({ error: "Failed to fetch raw material" });
    }
  }

  /**
   * POST /api/cost-engine/raw-materials
   * Crea una nueva materia prima
   */
  public async createRawMaterial(req: Request, res: Response): Promise<void> {
    try {
      const material = req.body;
      const result = RawMaterialsModel.createRawMaterial(material);
      res.status(201).json({ id: result.lastInsertRowid, ...material });
    } catch (error) {
      console.error("Error creating raw material:", error);
      res.status(500).json({ error: "Failed to create raw material" });
    }
  }

  /**
   * PUT /api/cost-engine/raw-materials/:id
   * Actualiza una materia prima y recalcula productos afectados
   */
  public async updateRawMaterial(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const material = req.body;

      const updated = RawMaterialsModel.updateRawMaterial(id, material);

      if (!updated) {
        res.status(404).json({ error: "Raw material not found" });
        return;
      }

      // Recalcular recetas que usan esta materia prima
      const affectedRecipes = RawMaterialsModel.getRawMaterialsInRecipes(id);
      for (const recipeId of affectedRecipes) {
        RecipesModel.recalculateRecipeCost(recipeId);
      }

      // Recalcular productos que usan esas recetas
      for (const recipeId of affectedRecipes) {
        const affectedProducts = CostProductsModel.getProductsUsingRecipe(recipeId);
        for (const productId of affectedProducts) {
          CostProductsModel.recalculateProductPrice(productId);
        }
      }

      const updatedMaterial = RawMaterialsModel.getRawMaterialById(id);
      res.status(200).json(updatedMaterial);
    } catch (error) {
      console.error("Error updating raw material:", error);
      res.status(500).json({ error: "Failed to update raw material" });
    }
  }

  /**
   * DELETE /api/cost-engine/raw-materials/:id
   * Elimina (desactiva) una materia prima
   */
  public async deleteRawMaterial(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = RawMaterialsModel.deleteRawMaterial(id);

      if (!deleted) {
        res.status(404).json({ error: "Raw material not found" });
        return;
      }

      res.status(200).json({ message: "Raw material deleted successfully" });
    } catch (error) {
      console.error("Error deleting raw material:", error);
      res.status(500).json({ error: "Failed to delete raw material" });
    }
  }
}

export default new RawMaterialsController();
