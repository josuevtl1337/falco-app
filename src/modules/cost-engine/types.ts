// Tipos para el módulo Cost Engine

export interface ISupplier {
  id: number;
  name: string;
  contact_info?: string;
  active: number;
  created_at?: string;
}

export interface IRawMaterial {
  id: number;
  name: string;
  supplier_id: number;
  supplier_name?: string;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: 'kg' | 'gr' | 'l' | 'ml' | 'unidad';
  unit_cost: number;
  active: number;
  last_price_update?: string;
  created_at?: string;
}

export interface IRecipeIngredient {
  id?: number;
  recipe_id?: number;
  raw_material_id: number;
  raw_material_name?: string;
  quantity: number;
  unit: 'kg' | 'gr' | 'l' | 'ml' | 'unidad';
  unit_cost?: number;
  ingredient_cost?: number;
}

export interface IRecipe {
  id: number;
  name: string;
  description?: string;
  recipe_cost: number;
  active: number;
  created_at?: string;
  updated_at?: string;
  ingredients?: IRecipeIngredient[];
}

export interface ICostProduct {
  id: number;
  name: string;
  recipe_id?: number;
  recipe_name?: string;
  recipe_cost?: number;
  fixed_cost: number;
  fixed_cost_type: 'per_item' | 'per_minute' | 'global';
  preparation_time_minutes: number;
  margin_percentage: number;
  calculated_cost: number;
  suggested_price: number;
  rounded_price: number;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export interface IFixedCost {
  id: number;
  name: string;
  description?: string;
  cost_per_item: number;
  cost_per_minute: number;
  is_global: number; // 1 = global, 0 = por producto
  product_id?: number;
  product_name?: string;
  active: number;
  created_at?: string;
}

export type UnitType = 'kg' | 'gr' | 'l' | 'ml' | 'unidad';
export type FixedCostType = 'per_item' | 'per_minute' | 'global';
