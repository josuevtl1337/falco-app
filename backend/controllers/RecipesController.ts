import type { Response, Request } from "express";
import RecipesModel from "../models/RecipesModel.ts";
import CostProductsModel from "../models/CostProductsModel.ts";

class RecipesController {
  /**
   * GET /api/cost-engine/recipes
   * Obtiene todas las recetas
   */
  public async getAllRecipes(req: Request, res: Response): Promise<void> {
    try {
      const recipes = RecipesModel.getAllRecipes();
      res.status(200).json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  }

  /**
   * GET /api/cost-engine/recipes/:id
   * Obtiene una receta por ID
   */
  public async getRecipeById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const recipe = RecipesModel.getRecipeById(id);

      if (!recipe) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }

      res.status(200).json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  }

  /**
   * POST /api/cost-engine/recipes
   * Crea una nueva receta
   */
  public async createRecipe(req: Request, res: Response): Promise<void> {
    try {
      const recipe = req.body;
      const result = RecipesModel.createRecipe(recipe);
      const createdRecipe = RecipesModel.getRecipeById(result.lastInsertRowid);
      res.status(201).json(createdRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  }

  /**
   * PUT /api/cost-engine/recipes/:id
   * Actualiza una receta y recalcula productos afectados
   */
  public async updateRecipe(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const recipe = req.body;

      const updated = RecipesModel.updateRecipe(id, recipe);

      if (!updated) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }

      // Recalcular productos que usan esta receta
      const affectedProducts = CostProductsModel.getProductsUsingRecipe(id);
      for (const productId of affectedProducts) {
        CostProductsModel.recalculateProductPrice(productId);
      }

      const updatedRecipe = RecipesModel.getRecipeById(id);
      res.status(200).json(updatedRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  }

  /**
   * POST /api/cost-engine/recipes/:id/recalculate
   * Recalcula manualmente el costo de una receta
   */
  public async recalculateRecipe(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const recipeCost = RecipesModel.recalculateRecipeCost(id);

      // Recalcular productos que usan esta receta
      const affectedProducts = CostProductsModel.getProductsUsingRecipe(id);
      for (const productId of affectedProducts) {
        CostProductsModel.recalculateProductPrice(productId);
      }

      const updatedRecipe = RecipesModel.getRecipeById(id);
      res.status(200).json(updatedRecipe);
    } catch (error) {
      console.error("Error recalculating recipe:", error);
      res.status(500).json({ error: "Failed to recalculate recipe" });
    }
  }

  /**
   * DELETE /api/cost-engine/recipes/:id
   * Elimina (desactiva) una receta
   */
  public async deleteRecipe(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = RecipesModel.deleteRecipe(id);

      if (!deleted) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }

      res.status(200).json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  }
}

export default new RecipesController();
