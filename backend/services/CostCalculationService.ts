/**
 * Servicio de Cálculo de Costos
 * 
 * Este servicio contiene toda la lógica de negocio para calcular:
 * - Costos unitarios de materias primas
 * - Costos de recetas
 * - Precios finales con márgenes
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
  unit_cost?: number; // Costo unitario de la materia prima
}

export interface ProductCalculation {
  recipe_cost: number;
  fixed_cost: number;
  total_cost: number;
  suggested_price: number;
  rounded_price: number;
}

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

/**
 * Convierte desde unidad base a la unidad objetivo
 */
function convertFromBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  const fromBase = convertToBaseUnit(1, fromUnit);
  const toBase = convertToBaseUnit(1, toUnit);
  
  if (fromBase === 0 || toBase === 0) return quantity;
  
  return (quantity * fromBase) / toBase;
}

/**
 * Calcula el costo unitario de una materia prima
 * 
 * @param purchasePrice - Precio total de compra
 * @param purchaseQuantity - Cantidad comprada
 * @param purchaseUnit - Unidad de compra ('kg', 'gr', 'l', 'ml', 'unidad')
 * @param targetUnit - Unidad objetivo para el costo unitario (opcional, por defecto igual a purchaseUnit)
 * @returns Costo unitario en la unidad especificada
 * 
 * @example
 * calculateUnitCost(7600, 1000, 'gr', 'gr') // 7.6 $/gr
 * calculateUnitCost(7600, 1, 'kg', 'gr') // 7.6 $/gr
 */
export function calculateUnitCost(
  purchasePrice: number,
  purchaseQuantity: number,
  purchaseUnit: string,
  targetUnit?: string
): number {
  if (purchaseQuantity <= 0) {
    throw new Error('La cantidad de compra debe ser mayor a 0');
  }

  const target = targetUnit || purchaseUnit;
  
  // Determinar el tipo de unidad (peso, volumen, unidad)
  const getUnitType = (unit: string): string => {
    if (unit === 'kg' || unit === 'gr') return 'weight';
    if (unit === 'l' || unit === 'ml') return 'volume';
    return 'unit';
  };

  const purchaseType = getUnitType(purchaseUnit);
  const targetType = getUnitType(target);

  // No se puede convertir entre diferentes tipos (peso vs volumen)
  if (purchaseType !== targetType && purchaseType !== 'unit' && targetType !== 'unit') {
    throw new Error(`No se puede convertir entre ${purchaseUnit} y ${target} (diferentes tipos de unidad)`);
  }

  // Convertir cantidad de compra a unidad base
  const purchaseInBase = convertToBaseUnit(purchaseQuantity, purchaseUnit);
  
  // Calcular costo por unidad base
  const costPerBaseUnit = purchasePrice / purchaseInBase;
  
  // Si la unidad objetivo es diferente, convertir el costo
  if (target !== purchaseUnit) {
    // Convertir 1 unidad de la unidad objetivo a unidad base
    const oneTargetInBase = convertToBaseUnit(1, target);
    // El costo por unidad objetivo es el costo por unidad base multiplicado por la conversión
    return costPerBaseUnit * oneTargetInBase;
  }
  
  return costPerBaseUnit;
}

/**
 * Calcula el costo total de una receta basado en sus ingredientes
 * 
 * @param ingredients - Array de ingredientes con sus cantidades y costos unitarios
 * @returns Costo total de la receta
 * 
 * @example
 * calculateRecipeCost([
 *   { raw_material_id: 1, quantity: 18, unit: 'gr', unit_cost: 0.5 },
 *   { raw_material_id: 2, quantity: 130, unit: 'ml', unit_cost: 0.08 }
 * ]) // Calcula el costo total
 */
export function calculateRecipeCost(ingredients: RecipeIngredient[]): number {
  if (!ingredients || ingredients.length === 0) {
    return 0;
  }

  let totalCost = 0;

  for (const ingredient of ingredients) {
    if (!ingredient.unit_cost || ingredient.unit_cost <= 0) {
      console.warn(`Ingrediente ${ingredient.raw_material_id} sin costo unitario válido`);
      continue;
    }

    if (ingredient.quantity <= 0) {
      continue;
    }

    // Convertir cantidad del ingrediente a la unidad base del costo
    // Asumimos que el unit_cost está en la misma unidad que el purchase_unit de la materia prima
    // Necesitamos convertir la cantidad del ingrediente a esa unidad
    
    // Por simplicidad, asumimos que el unit_cost ya está en la unidad correcta
    // En una implementación más robusta, haríamos conversión de unidades aquí
    totalCost += ingredient.quantity * ingredient.unit_cost;
  }

  return Math.round(totalCost * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula el precio final de un producto incluyendo gastos fijos y margen
 * 
 * @param recipeCost - Costo de la receta
 * @param fixedCost - Costo fijo (por ítem o por minuto)
 * @param marginPercentage - Margen de ganancia en porcentaje (ej: 50 = 50%)
 * @param roundTo - Valor al que redondear el precio final (ej: 10, 50, 100)
 * @returns Objeto con todos los cálculos
 * 
 * @example
 * calculateFinalPrice(25.5, 5, 50, 10)
 * // { total_cost: 30.5, suggested_price: 45.75, rounded_price: 50 }
 */
export function calculateFinalPrice(
  recipeCost: number,
  fixedCost: number = 0,
  marginPercentage: number = 50,
  roundTo: number = 10
): ProductCalculation {
  // Costo total = costo de receta + gastos fijos
  const totalCost = recipeCost + fixedCost;

  // Precio sugerido = costo total * (1 + margen/100)
  const suggestedPrice = totalCost * (1 + marginPercentage / 100);

  // Precio redondeado para carta
  const roundedPrice = Math.ceil(suggestedPrice / roundTo) * roundTo;

  return {
    recipe_cost: Math.round(recipeCost * 100) / 100,
    fixed_cost: Math.round(fixedCost * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    suggested_price: Math.round(suggestedPrice * 100) / 100,
    rounded_price: roundedPrice
  };
}

/**
 * Calcula el gasto fijo basado en el tipo (por ítem, por minuto, o global)
 * 
 * @param fixedCostPerItem - Costo fijo por ítem
 * @param fixedCostPerMinute - Costo fijo por minuto
 * @param preparationTimeMinutes - Tiempo de preparación en minutos
 * @param fixedCostType - Tipo de costo fijo ('per_item', 'per_minute', 'global')
 * @returns Costo fijo calculado
 */
export function calculateFixedCost(
  fixedCostPerItem: number = 0,
  fixedCostPerMinute: number = 0,
  preparationTimeMinutes: number = 0,
  fixedCostType: string = 'per_item'
): number {
  switch (fixedCostType) {
    case 'per_item':
      return fixedCostPerItem;
    case 'per_minute':
      return fixedCostPerMinute * preparationTimeMinutes;
    case 'global':
      return fixedCostPerItem; // En este caso, fixedCostPerItem representa el costo global
    default:
      return fixedCostPerItem;
  }
}

/**
 * Recalcula todos los precios de productos que usan una materia prima específica
 * Útil cuando se actualiza el precio de una materia prima
 * 
 * @param rawMaterialId - ID de la materia prima actualizada
 * @param newUnitCost - Nuevo costo unitario
 * @returns Array de IDs de productos afectados
 */
export function getAffectedProducts(rawMaterialId: number): number[] {
  // Esta función debería ser implementada en el modelo para consultar la BD
  // Retornamos un array vacío como placeholder
  return [];
}
