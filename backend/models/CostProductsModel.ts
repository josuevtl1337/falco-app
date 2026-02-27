import db from "../db.ts";
import { calculateFinalPrice, calculateFixedCost } from "../services/CostCalculationService.ts";
import RecipesModel from "./RecipesModel.ts";

export interface ICostProduct {
  id?: number;
  name: string;
  recipe_id?: number;
  fixed_cost?: number;
  fixed_cost_type?: string; // 'per_item', 'per_minute', 'global'
  preparation_time_minutes?: number;
  margin_percentage?: number;
  calculated_cost?: number;
  suggested_price?: number;
  rounded_price?: number;
  active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ICostProductWithDetails extends ICostProduct {
  recipe_name?: string;
  recipe_cost?: number;
}

class CostProductsModel {
  /**
   * Obtiene todos los productos de costo activos con sus detalles
   */
  public getAllCostProducts(): ICostProductWithDetails[] {
    const query = `
      SELECT 
        cp.*,
        r.name as recipe_name,
        r.recipe_cost
      FROM cost_products cp
      LEFT JOIN recipes r ON cp.recipe_id = r.id
      WHERE cp.active = 1
      ORDER BY cp.name
    `;
    return db.prepare(query).all() as ICostProductWithDetails[];
  }

  /**
   * Obtiene un producto por ID con todos sus detalles
   */
  public getCostProductById(id: number): ICostProductWithDetails | undefined {
    const query = `
      SELECT 
        cp.*,
        r.name as recipe_name,
        r.recipe_cost
      FROM cost_products cp
      LEFT JOIN recipes r ON cp.recipe_id = r.id
      WHERE cp.id = ?
    `;
    return db.prepare(query).get(id) as ICostProductWithDetails | undefined;
  }

  /**
   * Crea un nuevo producto y calcula automáticamente sus precios
   */
  public createCostProduct(product: ICostProduct): { lastInsertRowid: number } {
    const {
      name,
      recipe_id,
      fixed_cost = 0,
      fixed_cost_type = 'per_item',
      preparation_time_minutes = 0,
      margin_percentage = 50
    } = product;

    // Obtener costo de receta si existe
    let recipeCost = 0;
    if (recipe_id) {
      const recipe = RecipesModel.getRecipeById(recipe_id);
      recipeCost = recipe?.recipe_cost || 0;
    }

    // Calcular gasto fijo
    const calculatedFixedCost = calculateFixedCost(
      fixed_cost,
      0, // fixedCostPerMinute - se puede agregar después
      preparation_time_minutes,
      fixed_cost_type
    );

    // Calcular precio final
    const priceCalculation = calculateFinalPrice(
      recipeCost,
      calculatedFixedCost,
      margin_percentage,
      10 // roundTo: redondear a múltiplos de 10
    );

    const query = `
      INSERT INTO cost_products 
        (name, recipe_id, fixed_cost, fixed_cost_type, preparation_time_minutes, 
         margin_percentage, calculated_cost, suggested_price, rounded_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(query).run(
      name,
      recipe_id || null,
      calculatedFixedCost,
      fixed_cost_type,
      preparation_time_minutes,
      margin_percentage,
      priceCalculation.total_cost,
      priceCalculation.suggested_price,
      priceCalculation.rounded_price
    );

    return { lastInsertRowid: result.lastInsertRowid as number };
  }

  /**
   * Actualiza un producto y recalcula automáticamente sus precios
   */
  public updateCostProduct(id: number, product: Partial<ICostProduct>): boolean {
    const existing = this.getCostProductById(id);
    if (!existing) return false;

    const updates: string[] = [];
    const values: any[] = [];

    if (product.name !== undefined) {
      updates.push("name = ?");
      values.push(product.name);
    }

    if (product.recipe_id !== undefined) {
      updates.push("recipe_id = ?");
      values.push(product.recipe_id);
    }

    if (product.fixed_cost !== undefined) {
      updates.push("fixed_cost = ?");
      values.push(product.fixed_cost);
    }

    if (product.fixed_cost_type !== undefined) {
      updates.push("fixed_cost_type = ?");
      values.push(product.fixed_cost_type);
    }

    if (product.preparation_time_minutes !== undefined) {
      updates.push("preparation_time_minutes = ?");
      values.push(product.preparation_time_minutes);
    }

    if (product.margin_percentage !== undefined) {
      updates.push("margin_percentage = ?");
      values.push(product.margin_percentage);
    }

    if (product.active !== undefined) {
      updates.push("active = ?");
      values.push(product.active);
    }

    if (updates.length === 0) return false;

    // Recalcular precios si cambió algo relevante
    const needsRecalculation = 
      product.recipe_id !== undefined ||
      product.fixed_cost !== undefined ||
      product.fixed_cost_type !== undefined ||
      product.preparation_time_minutes !== undefined ||
      product.margin_percentage !== undefined;

    if (needsRecalculation) {
      const recipeId = product.recipe_id ?? existing.recipe_id;
      const fixedCost = product.fixed_cost ?? existing.fixed_cost ?? 0;
      const fixedCostType = product.fixed_cost_type ?? existing.fixed_cost_type ?? 'per_item';
      const prepTime = product.preparation_time_minutes ?? existing.preparation_time_minutes ?? 0;
      const margin = product.margin_percentage ?? existing.margin_percentage ?? 50;

      // Obtener costo de receta
      let recipeCost = 0;
      if (recipeId) {
        const recipe = RecipesModel.getRecipeById(recipeId);
        recipeCost = recipe?.recipe_cost || 0;
      }

      // Calcular gasto fijo
      const calculatedFixedCost = calculateFixedCost(
        fixedCost,
        0,
        prepTime,
        fixedCostType
      );

      // Calcular precio final
      const priceCalculation = calculateFinalPrice(recipeCost, calculatedFixedCost, margin, 10);

      updates.push("calculated_cost = ?");
      updates.push("suggested_price = ?");
      updates.push("rounded_price = ?");
      values.push(
        priceCalculation.total_cost,
        priceCalculation.suggested_price,
        priceCalculation.rounded_price
      );
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const query = `UPDATE cost_products SET ${updates.join(", ")} WHERE id = ?`;
    const result = db.prepare(query).run(...values);

    return result.changes > 0;
  }

  /**
   * Recalcula los precios de un producto (útil cuando cambia una materia prima)
   */
  public recalculateProductPrice(productId: number): boolean {
    const product = this.getCostProductById(productId);
    if (!product) return false;

    // Obtener costo de receta actualizado
    let recipeCost = 0;
    if (product.recipe_id) {
      RecipesModel.recalculateRecipeCost(product.recipe_id);
      const recipe = RecipesModel.getRecipeById(product.recipe_id);
      recipeCost = recipe?.recipe_cost || 0;
    }

    // Calcular gasto fijo
    const fixedCost = calculateFixedCost(
      product.fixed_cost || 0,
      0,
      product.preparation_time_minutes || 0,
      product.fixed_cost_type || 'per_item'
    );

    // Calcular precio final
    const priceCalculation = calculateFinalPrice(
      recipeCost,
      fixedCost,
      product.margin_percentage || 50,
      10
    );

    // Actualizar en BD
    const query = `
      UPDATE cost_products 
      SET calculated_cost = ?, 
          suggested_price = ?, 
          rounded_price = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = db.prepare(query).run(
      priceCalculation.total_cost,
      priceCalculation.suggested_price,
      priceCalculation.rounded_price,
      productId
    );

    return result.changes > 0;
  }

  /**
   * Elimina (desactiva) un producto
   */
  public deleteCostProduct(id: number): boolean {
    const query = `UPDATE cost_products SET active = 0 WHERE id = ?`;
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  /**
   * Obtiene productos que usan una receta específica
   */
  public getProductsUsingRecipe(recipeId: number): number[] {
    const query = `SELECT id FROM cost_products WHERE recipe_id = ? AND active = 1`;
    const results = db.prepare(query).all(recipeId) as { id: number }[];
    return results.map(r => r.id);
  }
}

export default new CostProductsModel();
