/**
 * Cost calculation service.
 *
 * This service contains business logic for:
 * - Raw material unit costs
 * - Recipe costs
 * - Final prices with margins
 */

export interface RawMaterial {
  id: number;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string; // 'kg', 'gr', 'l', 'ml', 'unidad'
}

export interface RecipeIngredient {
  raw_material_id: number;
  quantity: number;
  unit: string; // 'kg', 'gr', 'l', 'ml', 'unidad'
  unit_cost?: number; // Raw material unit cost
}

export interface ProductCalculation {
  recipe_cost: number;
  fixed_cost: number;
  total_cost: number;
  suggested_price: number;
  rounded_price: number;
}

/**
 * Converts a quantity to a base unit for consistent calculations.
 */
function convertToBaseUnit(quantity: number, unit: string): number {
  const conversions: Record<string, number> = {
    kg: 1000, // base: gr
    gr: 1,
    l: 1000, // base: ml
    ml: 1,
    unidad: 1,
  };

  return quantity * (conversions[unit] || 1);
}

/**
 * Calculates unit cost for a raw material.
 *
 * @param purchasePrice Total purchase price.
 * @param purchaseQuantity Purchased quantity.
 * @param purchaseUnit Purchase unit ('kg', 'gr', 'l', 'ml', 'unidad').
 * @param targetUnit Target unit for the returned cost (defaults to purchaseUnit).
 * @returns Unit cost in targetUnit.
 */
export function calculateUnitCost(
  purchasePrice: number,
  purchaseQuantity: number,
  purchaseUnit: string,
  targetUnit?: string
): number {
  if (purchaseQuantity <= 0) {
    throw new Error("La cantidad de compra debe ser mayor a 0");
  }

  const target = targetUnit || purchaseUnit;

  const getUnitType = (unit: string): string => {
    if (unit === "kg" || unit === "gr") return "weight";
    if (unit === "l" || unit === "ml") return "volume";
    return "unit";
  };

  const purchaseType = getUnitType(purchaseUnit);
  const targetType = getUnitType(target);

  if (purchaseType !== targetType && purchaseType !== "unit" && targetType !== "unit") {
    throw new Error(`No se puede convertir entre ${purchaseUnit} y ${target} (diferentes tipos de unidad)`);
  }

  const purchaseInBase = convertToBaseUnit(purchaseQuantity, purchaseUnit);
  const costPerBaseUnit = purchasePrice / purchaseInBase;

  // Always convert to target unit.
  // When target === purchaseUnit and purchaseUnit is kg/l, this avoids returning gr/ml costs.
  const oneTargetInBase = convertToBaseUnit(1, target);
  return costPerBaseUnit * oneTargetInBase;
}

/**
 * Calculates full recipe cost from ingredients.
 */
export function calculateRecipeCost(ingredients: RecipeIngredient[]): number {
  if (!ingredients || ingredients.length === 0) {
    return 0;
  }

  let totalCost = 0;

  for (const ingredient of ingredients) {
    if (!ingredient.unit_cost || ingredient.unit_cost <= 0) {
      console.warn(`Ingrediente ${ingredient.raw_material_id} sin costo unitario valido`);
      continue;
    }

    if (ingredient.quantity <= 0) {
      continue;
    }

    totalCost += ingredient.quantity * ingredient.unit_cost;
  }

  return Math.round(totalCost * 100) / 100;
}

/**
 * Calculates final selling price.
 */
export function calculateFinalPrice(
  recipeCost: number,
  fixedCost: number = 0,
  marginPercentage: number = 50,
  roundTo: number = 10
): ProductCalculation {
  const totalCost = recipeCost + fixedCost;
  const suggestedPrice = totalCost * (1 + marginPercentage / 100);
  const roundedPrice = Math.ceil(suggestedPrice / roundTo) * roundTo;

  return {
    recipe_cost: Math.round(recipeCost * 100) / 100,
    fixed_cost: Math.round(fixedCost * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    suggested_price: Math.round(suggestedPrice * 100) / 100,
    rounded_price: roundedPrice,
  };
}

/**
 * Calculates fixed cost based on fixed cost type.
 */
export function calculateFixedCost(
  fixedCostPerItem: number = 0,
  fixedCostPerMinute: number = 0,
  preparationTimeMinutes: number = 0,
  fixedCostType: string = "per_item"
): number {
  switch (fixedCostType) {
    case "per_item":
      return fixedCostPerItem;
    case "per_minute":
      return fixedCostPerMinute * preparationTimeMinutes;
    case "global":
      return fixedCostPerItem;
    default:
      return fixedCostPerItem;
  }
}

/**
 * Placeholder for future dependency graph recalculation.
 */
export function getAffectedProducts(_rawMaterialId: number): number[] {
  return [];
}
