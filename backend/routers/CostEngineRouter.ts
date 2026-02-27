import { Router } from "express";
import RawMaterialsController from "../controllers/RawMaterialsController.ts";
import SuppliersController from "../controllers/SuppliersController.ts";
import RecipesController from "../controllers/RecipesController.ts";
import CostProductsController from "../controllers/CostProductsController.ts";
import FixedCostsController from "../controllers/FixedCostsController.ts";

const CostEngineRouter = Router();

// Rutas de Proveedores
CostEngineRouter.get("/cost-engine/suppliers", SuppliersController.getAllSuppliers);
CostEngineRouter.get("/cost-engine/suppliers/:id", SuppliersController.getSupplierById);
CostEngineRouter.post("/cost-engine/suppliers", SuppliersController.createSupplier);
CostEngineRouter.put("/cost-engine/suppliers/:id", SuppliersController.updateSupplier);
CostEngineRouter.delete("/cost-engine/suppliers/:id", SuppliersController.deleteSupplier);

// Rutas de Materias Primas
CostEngineRouter.get("/cost-engine/raw-materials", RawMaterialsController.getAllRawMaterials);
CostEngineRouter.get("/cost-engine/raw-materials/:id", RawMaterialsController.getRawMaterialById);
CostEngineRouter.post("/cost-engine/raw-materials", RawMaterialsController.createRawMaterial);
CostEngineRouter.put("/cost-engine/raw-materials/:id", RawMaterialsController.updateRawMaterial);
CostEngineRouter.delete("/cost-engine/raw-materials/:id", RawMaterialsController.deleteRawMaterial);

// Rutas de Recetas
CostEngineRouter.get("/cost-engine/recipes", RecipesController.getAllRecipes);
CostEngineRouter.get("/cost-engine/recipes/:id", RecipesController.getRecipeById);
CostEngineRouter.post("/cost-engine/recipes", RecipesController.createRecipe);
CostEngineRouter.put("/cost-engine/recipes/:id", RecipesController.updateRecipe);
CostEngineRouter.post("/cost-engine/recipes/:id/recalculate", RecipesController.recalculateRecipe);
CostEngineRouter.delete("/cost-engine/recipes/:id", RecipesController.deleteRecipe);

// Rutas de Productos de Costo
CostEngineRouter.get("/cost-engine/products", CostProductsController.getAllCostProducts);
CostEngineRouter.get("/cost-engine/products/:id", CostProductsController.getCostProductById);
CostEngineRouter.post("/cost-engine/products", CostProductsController.createCostProduct);
CostEngineRouter.put("/cost-engine/products/:id", CostProductsController.updateCostProduct);
CostEngineRouter.post("/cost-engine/products/:id/recalculate", CostProductsController.recalculateProduct);
CostEngineRouter.delete("/cost-engine/products/:id", CostProductsController.deleteCostProduct);

// Rutas de Gastos Fijos
CostEngineRouter.get("/cost-engine/fixed-costs", FixedCostsController.getAllFixedCosts);
CostEngineRouter.get("/cost-engine/fixed-costs/global", FixedCostsController.getGlobalFixedCosts);
CostEngineRouter.get("/cost-engine/fixed-costs/product/:productId", FixedCostsController.getProductFixedCosts);
CostEngineRouter.get("/cost-engine/fixed-costs/:id", FixedCostsController.getFixedCostById);
CostEngineRouter.post("/cost-engine/fixed-costs", FixedCostsController.createFixedCost);
CostEngineRouter.put("/cost-engine/fixed-costs/:id", FixedCostsController.updateFixedCost);
CostEngineRouter.delete("/cost-engine/fixed-costs/:id", FixedCostsController.deleteFixedCost);

export default CostEngineRouter;
