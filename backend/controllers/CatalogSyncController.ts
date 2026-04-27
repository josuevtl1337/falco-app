import type { Request, Response } from "express";
import CatalogSyncModel, { type CatalogSyncPayload } from "../models/CatalogSyncModel.ts";

function sanitizePayload(input: unknown): CatalogSyncPayload {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<CatalogSyncPayload>;
  return {
    meta: {
      version: raw.meta?.version ?? 1,
      exported_at: raw.meta?.exported_at ?? "",
      source: raw.meta?.source ?? "unknown",
    },
    suppliers: Array.isArray(raw.suppliers) ? raw.suppliers : [],
    raw_materials: Array.isArray(raw.raw_materials) ? raw.raw_materials : [],
    recipes: Array.isArray(raw.recipes) ? raw.recipes : [],
    recipe_ingredients: Array.isArray(raw.recipe_ingredients) ? raw.recipe_ingredients : [],
    cost_products: Array.isArray(raw.cost_products) ? raw.cost_products : [],
    fixed_costs: Array.isArray(raw.fixed_costs) ? raw.fixed_costs : [],
  };
}

class CatalogSyncController {
  /**
   * GET /api/cost-engine/catalog/export
   */
  public async exportCatalog(_req: Request, res: Response): Promise<void> {
    try {
      const payload = CatalogSyncModel.exportCatalog();
      res.status(200).json(payload);
    } catch (error) {
      console.error("Error exporting catalog:", error);
      res.status(500).json({ error: "Failed to export catalog" });
    }
  }

  /**
   * POST /api/cost-engine/catalog/import
   */
  public async importCatalog(req: Request, res: Response): Promise<void> {
    try {
      const directPayload = sanitizePayload(req.body);
      const wrappedPayload = sanitizePayload((req.body as { catalog?: unknown })?.catalog);

      const hasDirectData =
        directPayload.suppliers.length > 0 ||
        directPayload.raw_materials.length > 0 ||
        directPayload.recipes.length > 0 ||
        directPayload.recipe_ingredients.length > 0 ||
        directPayload.cost_products.length > 0 ||
        directPayload.fixed_costs.length > 0;

      const payload = hasDirectData ? directPayload : wrappedPayload;
      const summary = CatalogSyncModel.importCatalog(payload);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error importing catalog:", error);
      res.status(500).json({ error: "Failed to import catalog" });
    }
  }
}

export default new CatalogSyncController();
