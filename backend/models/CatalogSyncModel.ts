import db, { getLocalTimestamp } from "../db.ts";
import { calculateUnitCost } from "../services/CostCalculationService.ts";
import RecipesModel from "./RecipesModel.ts";
import CostProductsModel from "./CostProductsModel.ts";

type Nullable<T> = T | null;

export interface CatalogSupplier {
  id: number;
  name: string;
  contact_info: Nullable<string>;
  active: number;
  created_at: string;
}

export interface CatalogRawMaterial {
  id: number;
  name: string;
  supplier_id: number;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string;
  unit_cost: number;
  active: number;
  last_price_update: Nullable<string>;
  created_at: string;
}

export interface CatalogRecipe {
  id: number;
  name: string;
  description: Nullable<string>;
  recipe_cost: number;
  active: number;
  created_at: string;
  updated_at: Nullable<string>;
}

export interface CatalogRecipeIngredient {
  id: number;
  recipe_id: number;
  raw_material_id: number;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface CatalogCostProduct {
  id: number;
  name: string;
  recipe_id: Nullable<number>;
  fixed_cost: number;
  fixed_cost_type: string;
  preparation_time_minutes: number;
  margin_percentage: number;
  calculated_cost: number;
  suggested_price: number;
  rounded_price: number;
  active: number;
  created_at: string;
  updated_at: Nullable<string>;
}

export interface CatalogFixedCost {
  id: number;
  name: string;
  description: Nullable<string>;
  cost_per_item: number;
  cost_per_minute: number;
  is_global: number;
  product_id: Nullable<number>;
  active: number;
  created_at: string;
}

export interface CatalogSyncPayload {
  meta: {
    version: number;
    exported_at: string;
    source: string;
  };
  suppliers: CatalogSupplier[];
  raw_materials: CatalogRawMaterial[];
  recipes: CatalogRecipe[];
  recipe_ingredients: CatalogRecipeIngredient[];
  cost_products: CatalogCostProduct[];
  fixed_costs: CatalogFixedCost[];
}

interface ImportTableSummary {
  created: number;
  updated: number;
  skipped: number;
}

interface ImportCatalogSummary {
  imported_at: string;
  source_meta?: CatalogSyncPayload["meta"];
  suppliers: ImportTableSummary;
  raw_materials: ImportTableSummary;
  recipes: ImportTableSummary;
  recipe_ingredients: ImportTableSummary;
  cost_products: ImportTableSummary;
  fixed_costs: ImportTableSummary;
}

function parseTimestamp(value: unknown): number | null {
  if (!value || typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function shouldApplyIncoming(existingTs: unknown, incomingTs: unknown): boolean {
  const existing = parseTimestamp(existingTs);
  const incoming = parseTimestamp(incomingTs);

  if (existing === null && incoming === null) return true;
  if (existing === null && incoming !== null) return true;
  if (existing !== null && incoming === null) return false;
  return (incoming as number) >= (existing as number);
}

class CatalogSyncModel {
  public exportCatalog(): CatalogSyncPayload {
    const suppliers = db
      .prepare(
        `SELECT id, name, contact_info, active, created_at
         FROM suppliers
         ORDER BY id`
      )
      .all() as CatalogSupplier[];

    const rawMaterials = db
      .prepare(
        `SELECT id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at
         FROM raw_materials
         ORDER BY id`
      )
      .all() as CatalogRawMaterial[];

    const recipes = db
      .prepare(
        `SELECT id, name, description, recipe_cost, active, created_at, updated_at
         FROM recipes
         ORDER BY id`
      )
      .all() as CatalogRecipe[];

    const recipeIngredients = db
      .prepare(
        `SELECT id, recipe_id, raw_material_id, quantity, unit, created_at
         FROM recipe_ingredients
         ORDER BY recipe_id, id`
      )
      .all() as CatalogRecipeIngredient[];

    const costProducts = db
      .prepare(
        `SELECT id, name, recipe_id, fixed_cost, fixed_cost_type, preparation_time_minutes, margin_percentage,
                calculated_cost, suggested_price, rounded_price, active, created_at, updated_at
         FROM cost_products
         ORDER BY id`
      )
      .all() as CatalogCostProduct[];

    const fixedCosts = db
      .prepare(
        `SELECT id, name, description, cost_per_item, cost_per_minute, is_global, product_id, active, created_at
         FROM fixed_costs
         ORDER BY id`
      )
      .all() as CatalogFixedCost[];

    return {
      meta: {
        version: 1,
        exported_at: getLocalTimestamp(),
        source: "falco-cost-engine-catalog",
      },
      suppliers,
      raw_materials: rawMaterials,
      recipes,
      recipe_ingredients: recipeIngredients,
      cost_products: costProducts,
      fixed_costs: fixedCosts,
    };
  }

  public importCatalog(payload: CatalogSyncPayload): ImportCatalogSummary {
    const transaction = db.transaction((incoming: CatalogSyncPayload) => {
      const summary: ImportCatalogSummary = {
        imported_at: getLocalTimestamp(),
        source_meta: incoming.meta,
        suppliers: { created: 0, updated: 0, skipped: 0 },
        raw_materials: { created: 0, updated: 0, skipped: 0 },
        recipes: { created: 0, updated: 0, skipped: 0 },
        recipe_ingredients: { created: 0, updated: 0, skipped: 0 },
        cost_products: { created: 0, updated: 0, skipped: 0 },
        fixed_costs: { created: 0, updated: 0, skipped: 0 },
      };

      const acceptedRecipeIds = new Set<number>();

      for (const supplier of incoming.suppliers || []) {
        const existing = db
          .prepare("SELECT id, created_at FROM suppliers WHERE id = ?")
          .get(supplier.id) as { id: number; created_at: string } | undefined;

        if (!existing) {
          db.prepare(
            `INSERT INTO suppliers (id, name, contact_info, active, created_at)
             VALUES (?, ?, ?, ?, ?)`
          ).run(
            supplier.id,
            supplier.name,
            supplier.contact_info ?? null,
            supplier.active ?? 1,
            supplier.created_at ?? getLocalTimestamp()
          );
          summary.suppliers.created++;
          continue;
        }

        if (!shouldApplyIncoming(existing.created_at, supplier.created_at)) {
          summary.suppliers.skipped++;
          continue;
        }

        db.prepare(
          `UPDATE suppliers
           SET name = ?, contact_info = ?, active = ?, created_at = ?
           WHERE id = ?`
        ).run(
          supplier.name,
          supplier.contact_info ?? null,
          supplier.active ?? 1,
          supplier.created_at ?? existing.created_at,
          supplier.id
        );
        summary.suppliers.updated++;
      }

      for (const material of incoming.raw_materials || []) {
        const existing = db
          .prepare("SELECT id, last_price_update, created_at FROM raw_materials WHERE id = ?")
          .get(material.id) as { id: number; last_price_update: string | null; created_at: string } | undefined;

        const incomingTs = material.last_price_update ?? material.created_at;
        const existingTs = existing?.last_price_update ?? existing?.created_at;

        if (existing && !shouldApplyIncoming(existingTs, incomingTs)) {
          summary.raw_materials.skipped++;
          continue;
        }

        const normalizedUnitCost = calculateUnitCost(
          material.purchase_price,
          material.purchase_quantity,
          material.purchase_unit,
          material.purchase_unit
        );

        if (!existing) {
          db.prepare(
            `INSERT INTO raw_materials
              (id, name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, active, last_price_update, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            material.id,
            material.name,
            material.supplier_id,
            material.purchase_price,
            material.purchase_quantity,
            material.purchase_unit,
            normalizedUnitCost,
            material.active ?? 1,
            material.last_price_update ?? getLocalTimestamp(),
            material.created_at ?? getLocalTimestamp()
          );
          summary.raw_materials.created++;
          continue;
        }

        db.prepare(
          `UPDATE raw_materials
           SET name = ?, supplier_id = ?, purchase_price = ?, purchase_quantity = ?, purchase_unit = ?,
               unit_cost = ?, active = ?, last_price_update = ?, created_at = ?
           WHERE id = ?`
        ).run(
          material.name,
          material.supplier_id,
          material.purchase_price,
          material.purchase_quantity,
          material.purchase_unit,
          normalizedUnitCost,
          material.active ?? 1,
          material.last_price_update ?? existing.last_price_update ?? getLocalTimestamp(),
          material.created_at ?? existing.created_at,
          material.id
        );
        summary.raw_materials.updated++;
      }

      for (const recipe of incoming.recipes || []) {
        const existing = db
          .prepare("SELECT id, updated_at, created_at FROM recipes WHERE id = ?")
          .get(recipe.id) as { id: number; updated_at: string | null; created_at: string } | undefined;

        const incomingTs = recipe.updated_at ?? recipe.created_at;
        const existingTs = existing?.updated_at ?? existing?.created_at;

        if (existing && !shouldApplyIncoming(existingTs, incomingTs)) {
          summary.recipes.skipped++;
          continue;
        }

        if (!existing) {
          db.prepare(
            `INSERT INTO recipes (id, name, description, recipe_cost, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(
            recipe.id,
            recipe.name,
            recipe.description ?? null,
            recipe.recipe_cost ?? 0,
            recipe.active ?? 1,
            recipe.created_at ?? getLocalTimestamp(),
            recipe.updated_at ?? getLocalTimestamp()
          );
          summary.recipes.created++;
        } else {
          db.prepare(
            `UPDATE recipes
             SET name = ?, description = ?, recipe_cost = ?, active = ?, created_at = ?, updated_at = ?
             WHERE id = ?`
          ).run(
            recipe.name,
            recipe.description ?? null,
            recipe.recipe_cost ?? 0,
            recipe.active ?? 1,
            recipe.created_at ?? existing.created_at,
            recipe.updated_at ?? existing.updated_at ?? getLocalTimestamp(),
            recipe.id
          );
          summary.recipes.updated++;
        }

        acceptedRecipeIds.add(recipe.id);
      }

      const ingredientsByRecipe = new Map<number, CatalogRecipeIngredient[]>();
      for (const ingredient of incoming.recipe_ingredients || []) {
        const recipeList = ingredientsByRecipe.get(ingredient.recipe_id) || [];
        recipeList.push(ingredient);
        ingredientsByRecipe.set(ingredient.recipe_id, recipeList);
      }

      for (const recipeId of acceptedRecipeIds) {
        db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(recipeId);
        const incomingIngredients = ingredientsByRecipe.get(recipeId) || [];

        for (const ingredient of incomingIngredients) {
          db.prepare(
            `INSERT INTO recipe_ingredients (id, recipe_id, raw_material_id, quantity, unit, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            ingredient.id,
            ingredient.recipe_id,
            ingredient.raw_material_id,
            ingredient.quantity,
            ingredient.unit,
            ingredient.created_at ?? getLocalTimestamp()
          );
        }

        summary.recipe_ingredients.updated += incomingIngredients.length;
      }

      for (const product of incoming.cost_products || []) {
        const existing = db
          .prepare("SELECT id, updated_at, created_at FROM cost_products WHERE id = ?")
          .get(product.id) as { id: number; updated_at: string | null; created_at: string } | undefined;

        const incomingTs = product.updated_at ?? product.created_at;
        const existingTs = existing?.updated_at ?? existing?.created_at;

        if (existing && !shouldApplyIncoming(existingTs, incomingTs)) {
          summary.cost_products.skipped++;
          continue;
        }

        if (!existing) {
          db.prepare(
            `INSERT INTO cost_products
              (id, name, recipe_id, fixed_cost, fixed_cost_type, preparation_time_minutes, margin_percentage,
               calculated_cost, suggested_price, rounded_price, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            product.id,
            product.name,
            product.recipe_id ?? null,
            product.fixed_cost ?? 0,
            product.fixed_cost_type ?? "per_item",
            product.preparation_time_minutes ?? 0,
            product.margin_percentage ?? 50,
            product.calculated_cost ?? 0,
            product.suggested_price ?? 0,
            product.rounded_price ?? 0,
            product.active ?? 1,
            product.created_at ?? getLocalTimestamp(),
            product.updated_at ?? getLocalTimestamp()
          );
          summary.cost_products.created++;
          continue;
        }

        db.prepare(
          `UPDATE cost_products
           SET name = ?, recipe_id = ?, fixed_cost = ?, fixed_cost_type = ?, preparation_time_minutes = ?,
               margin_percentage = ?, calculated_cost = ?, suggested_price = ?, rounded_price = ?,
               active = ?, created_at = ?, updated_at = ?
           WHERE id = ?`
        ).run(
          product.name,
          product.recipe_id ?? null,
          product.fixed_cost ?? 0,
          product.fixed_cost_type ?? "per_item",
          product.preparation_time_minutes ?? 0,
          product.margin_percentage ?? 50,
          product.calculated_cost ?? 0,
          product.suggested_price ?? 0,
          product.rounded_price ?? 0,
          product.active ?? 1,
          product.created_at ?? existing.created_at,
          product.updated_at ?? existing.updated_at ?? getLocalTimestamp(),
          product.id
        );
        summary.cost_products.updated++;
      }

      for (const fixedCost of incoming.fixed_costs || []) {
        const existing = db
          .prepare("SELECT id, created_at FROM fixed_costs WHERE id = ?")
          .get(fixedCost.id) as { id: number; created_at: string } | undefined;

        if (existing && !shouldApplyIncoming(existing.created_at, fixedCost.created_at)) {
          summary.fixed_costs.skipped++;
          continue;
        }

        if (!existing) {
          db.prepare(
            `INSERT INTO fixed_costs
              (id, name, description, cost_per_item, cost_per_minute, is_global, product_id, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            fixedCost.id,
            fixedCost.name,
            fixedCost.description ?? null,
            fixedCost.cost_per_item ?? 0,
            fixedCost.cost_per_minute ?? 0,
            fixedCost.is_global ?? 0,
            fixedCost.product_id ?? null,
            fixedCost.active ?? 1,
            fixedCost.created_at ?? getLocalTimestamp()
          );
          summary.fixed_costs.created++;
          continue;
        }

        db.prepare(
          `UPDATE fixed_costs
           SET name = ?, description = ?, cost_per_item = ?, cost_per_minute = ?, is_global = ?,
               product_id = ?, active = ?, created_at = ?
           WHERE id = ?`
        ).run(
          fixedCost.name,
          fixedCost.description ?? null,
          fixedCost.cost_per_item ?? 0,
          fixedCost.cost_per_minute ?? 0,
          fixedCost.is_global ?? 0,
          fixedCost.product_id ?? null,
          fixedCost.active ?? 1,
          fixedCost.created_at ?? existing.created_at,
          fixedCost.id
        );
        summary.fixed_costs.updated++;
      }

      for (const recipeId of acceptedRecipeIds) {
        RecipesModel.recalculateRecipeCost(recipeId);
      }

      const productsToRecalculate = db
        .prepare("SELECT id FROM cost_products WHERE active = 1")
        .all() as Array<{ id: number }>;
      for (const product of productsToRecalculate) {
        CostProductsModel.recalculateProductPrice(product.id);
      }

      return summary;
    });

    return transaction(payload);
  }
}

export default new CatalogSyncModel();
