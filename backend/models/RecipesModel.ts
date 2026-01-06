import db from "../db.ts";
import { calculateRecipeCost } from "../services/CostCalculationService.ts";
import RawMaterialsModel from "./RawMaterialsModel.ts";

/**
 * Convierte unidades a una unidad base para cálculos consistentes
 */
function convertToBaseUnit(quantity: number, unit: string): number {
  const conversions: Record<string, number> = {
    'kg': 1000,      // 1 kg = 1000 gr
    'gr': 1,         // base
    'l': 1000,       // 1 l = 1000 ml
    'ml': 1,         // base
    'unidad': 1      // base
  };

  return quantity * (conversions[unit] || 1);
}

export interface IRecipeIngredient {
  id?: number;
  recipe_id?: number;
  raw_material_id: number;
  quantity: number;
  unit: string; // 'kg', 'gr', 'l', 'ml', 'unidad'
}

export interface IRecipe {
  id?: number;
  name: string;
  description?: string;
  recipe_cost?: number;
  active?: number;
  created_at?: string;
  updated_at?: string;
  ingredients?: IRecipeIngredient[];
}

export interface IRecipeWithDetails extends IRecipe {
  ingredients: Array<IRecipeIngredient & {
    raw_material_name?: string;
    unit_cost?: number;
    ingredient_cost?: number;
  }>;
}

class RecipesModel {
  /**
   * Obtiene todas las recetas activas con sus ingredientes
   */
  public getAllRecipes(): IRecipeWithDetails[] {
    const recipes = db.prepare(`
      SELECT * FROM recipes 
      WHERE active = 1 
      ORDER BY name
    `).all() as IRecipe[];

    return recipes.map(recipe => this.getRecipeWithIngredients(recipe.id!));
  }

  /**
   * Obtiene una receta por ID con todos sus detalles
   */
  public getRecipeById(id: number): IRecipeWithDetails | undefined {
    const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as IRecipe | undefined;
    if (!recipe) return undefined;

    return this.getRecipeWithIngredients(id);
  }

  /**
   * Obtiene una receta con sus ingredientes y costos calculados
   */
  private getRecipeWithIngredients(recipeId: number): IRecipeWithDetails {
    const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(recipeId) as IRecipe;
    
    const ingredients = db.prepare(`
      SELECT 
        ri.*,
        rm.name as raw_material_name,
        rm.unit_cost,
        rm.purchase_unit
      FROM recipe_ingredients ri
      JOIN raw_materials rm ON ri.raw_material_id = rm.id
      WHERE ri.recipe_id = ?
    `).all(recipeId) as Array<IRecipeIngredient & {
      raw_material_name: string;
      unit_cost: number;
      purchase_unit: string;
    }>;

    // Calcular costo de cada ingrediente
    // Necesitamos convertir la cantidad del ingrediente a la unidad de compra
    const ingredientsWithCosts = ingredients.map(ing => {
      // Si la unidad del ingrediente es diferente a la unidad de compra, convertir
      let quantityInPurchaseUnit = ing.quantity;
      if (ing.unit !== ing.purchase_unit) {
        // Convertir cantidad del ingrediente a unidad de compra
        const ingredientInBase = convertToBaseUnit(ing.quantity, ing.unit);
        const purchaseUnitInBase = convertToBaseUnit(1, ing.purchase_unit);
        quantityInPurchaseUnit = ingredientInBase / purchaseUnitInBase;
      }
      return {
        ...ing,
        ingredient_cost: quantityInPurchaseUnit * ing.unit_cost
      };
    });

    return {
      ...recipe,
      ingredients: ingredientsWithCosts
    };
  }

  /**
   * Crea una nueva receta con sus ingredientes
   */
  public createRecipe(recipe: IRecipe): { lastInsertRowid: number } {
    const { name, description, ingredients } = recipe;

    // Insertar receta
    const recipeQuery = `
      INSERT INTO recipes (name, description) 
      VALUES (?, ?)
    `;
    const recipeResult = db.prepare(recipeQuery).run(name, description || null);
    const recipeId = recipeResult.lastInsertRowid as number;

    // Insertar ingredientes si existen
    if (ingredients && ingredients.length > 0) {
      this.updateRecipeIngredients(recipeId, ingredients);
    }

    // Calcular y actualizar costo de receta
    this.recalculateRecipeCost(recipeId);

    return { lastInsertRowid: recipeId };
  }

  /**
   * Actualiza una receta
   */
  public updateRecipe(id: number, recipe: Partial<IRecipe>): boolean {
    const updates: string[] = [];
    const values: any[] = [];

    if (recipe.name !== undefined) {
      updates.push("name = ?");
      values.push(recipe.name);
    }

    if (recipe.description !== undefined) {
      updates.push("description = ?");
      values.push(recipe.description);
    }

    if (recipe.active !== undefined) {
      updates.push("active = ?");
      values.push(recipe.active);
    }

    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
    }

    if (updates.length === 0 && !recipe.ingredients) return false;

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE recipes SET ${updates.join(", ")} WHERE id = ?`;
      db.prepare(query).run(...values);
    }

    // Actualizar ingredientes si se proporcionaron
    if (recipe.ingredients) {
      this.updateRecipeIngredients(id, recipe.ingredients);
      this.recalculateRecipeCost(id);
    }

    return true;
  }

  /**
   * Actualiza los ingredientes de una receta
   */
  private updateRecipeIngredients(recipeId: number, ingredients: IRecipeIngredient[]): void {
    // Eliminar ingredientes existentes
    db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(recipeId);

    // Insertar nuevos ingredientes
    const insertQuery = `
      INSERT INTO recipe_ingredients (recipe_id, raw_material_id, quantity, unit)
      VALUES (?, ?, ?, ?)
    `;
    const insertStmt = db.prepare(insertQuery);

    for (const ingredient of ingredients) {
      insertStmt.run(
        recipeId,
        ingredient.raw_material_id,
        ingredient.quantity,
        ingredient.unit
      );
    }
  }

  /**
   * Recalcula el costo de una receta basado en sus ingredientes
   */
  public recalculateRecipeCost(recipeId: number): number {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      db.prepare("UPDATE recipes SET recipe_cost = 0 WHERE id = ?").run(recipeId);
      return 0;
    }

    // Preparar ingredientes para el cálculo
    const ingredientsForCalculation = recipe.ingredients.map(ing => ({
      raw_material_id: ing.raw_material_id,
      quantity: ing.quantity,
      unit: ing.unit,
      unit_cost: ing.unit_cost || 0
    }));

    const recipeCost = calculateRecipeCost(ingredientsForCalculation);

    // Actualizar costo en la base de datos
    db.prepare("UPDATE recipes SET recipe_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(recipeCost, recipeId);

    return recipeCost;
  }

  /**
   * Elimina (desactiva) una receta
   */
  public deleteRecipe(id: number): boolean {
    const query = `UPDATE recipes SET active = 0 WHERE id = ?`;
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  /**
   * Obtiene recetas que usan una materia prima específica
   */
  public getRecipesUsingRawMaterial(rawMaterialId: number): number[] {
    const query = `
      SELECT DISTINCT recipe_id 
      FROM recipe_ingredients 
      WHERE raw_material_id = ?
    `;
    const results = db.prepare(query).all(rawMaterialId) as { recipe_id: number }[];
    return results.map(r => r.recipe_id);
  }
}

export default new RecipesModel();
