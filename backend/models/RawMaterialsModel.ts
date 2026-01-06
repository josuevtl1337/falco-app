import db from "../db.ts";
import { calculateUnitCost } from "../services/CostCalculationService.ts";

export interface IRawMaterial {
  id?: number;
  name: string;
  supplier_id: number;
  purchase_price: number;
  purchase_quantity: number;
  purchase_unit: string; // 'kg', 'gr', 'l', 'ml', 'unidad'
  unit_cost?: number;
  active?: number;
  last_price_update?: string;
  created_at?: string;
}

export interface IRawMaterialWithSupplier extends IRawMaterial {
  supplier_name?: string;
}

class RawMaterialsModel {
  /**
   * Obtiene todas las materias primas activas
   */
  public getAllRawMaterials(): IRawMaterialWithSupplier[] {
    const query = `
      SELECT 
        rm.*,
        s.name as supplier_name
      FROM raw_materials rm
      LEFT JOIN suppliers s ON rm.supplier_id = s.id
      WHERE rm.active = 1
      ORDER BY rm.name
    `;
    return db.prepare(query).all() as IRawMaterialWithSupplier[];
  }

  /**
   * Obtiene una materia prima por ID
   */
  public getRawMaterialById(id: number): IRawMaterialWithSupplier | undefined {
    const query = `
      SELECT 
        rm.*,
        s.name as supplier_name
      FROM raw_materials rm
      LEFT JOIN suppliers s ON rm.supplier_id = s.id
      WHERE rm.id = ?
    `;
    return db.prepare(query).get(id) as IRawMaterialWithSupplier | undefined;
  }

  /**
   * Crea una nueva materia prima y calcula automáticamente el costo unitario
   */
  public createRawMaterial(material: IRawMaterial): { lastInsertRowid: number } {
    const {
      name,
      supplier_id,
      purchase_price,
      purchase_quantity,
      purchase_unit
    } = material;

    // Calcular costo unitario automáticamente
    const unitCost = calculateUnitCost(
      purchase_price,
      purchase_quantity,
      purchase_unit,
      purchase_unit
    );

    const query = `
      INSERT INTO raw_materials 
        (name, supplier_id, purchase_price, purchase_quantity, purchase_unit, unit_cost, last_price_update)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const result = db.prepare(query).run(
      name,
      supplier_id,
      purchase_price,
      purchase_quantity,
      purchase_unit,
      unitCost
    );

    return { lastInsertRowid: result.lastInsertRowid as number };
  }

  /**
   * Actualiza una materia prima y recalcula el costo unitario
   */
  public updateRawMaterial(id: number, material: Partial<IRawMaterial>): boolean {
    const existing = this.getRawMaterialById(id);
    if (!existing) return false;

    const updates: string[] = [];
    const values: any[] = [];

    if (material.name !== undefined) {
      updates.push("name = ?");
      values.push(material.name);
    }

    if (material.supplier_id !== undefined) {
      updates.push("supplier_id = ?");
      values.push(material.supplier_id);
    }

    if (material.purchase_price !== undefined || 
        material.purchase_quantity !== undefined || 
        material.purchase_unit !== undefined) {
      
      const purchasePrice = material.purchase_price ?? existing.purchase_price;
      const purchaseQuantity = material.purchase_quantity ?? existing.purchase_quantity;
      const purchaseUnit = material.purchase_unit ?? existing.purchase_unit;

      // Recalcular costo unitario
      const unitCost = calculateUnitCost(purchasePrice, purchaseQuantity, purchaseUnit, purchaseUnit);
      
      updates.push("purchase_price = ?");
      updates.push("purchase_quantity = ?");
      updates.push("purchase_unit = ?");
      updates.push("unit_cost = ?");
      updates.push("last_price_update = CURRENT_TIMESTAMP");
      
      values.push(purchasePrice, purchaseQuantity, purchaseUnit, unitCost);
    }

    if (material.active !== undefined) {
      updates.push("active = ?");
      values.push(material.active);
    }

    if (updates.length === 0) return false;

    values.push(id);

    const query = `UPDATE raw_materials SET ${updates.join(", ")} WHERE id = ?`;
    const result = db.prepare(query).run(...values);

    return result.changes > 0;
  }

  /**
   * Elimina (desactiva) una materia prima
   */
  public deleteRawMaterial(id: number): boolean {
    const query = `UPDATE raw_materials SET active = 0 WHERE id = ?`;
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  /**
   * Obtiene materias primas usadas en recetas (para recalcular cuando cambia precio)
   */
  public getRawMaterialsInRecipes(rawMaterialId: number): number[] {
    const query = `
      SELECT DISTINCT recipe_id 
      FROM recipe_ingredients 
      WHERE raw_material_id = ?
    `;
    const results = db.prepare(query).all(rawMaterialId) as { recipe_id: number }[];
    return results.map(r => r.recipe_id);
  }
}

export default new RawMaterialsModel();
