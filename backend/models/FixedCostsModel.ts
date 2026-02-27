import db from "../db.ts";

export interface IFixedCost {
  id?: number;
  name: string;
  description?: string;
  cost_per_item?: number;
  cost_per_minute?: number;
  is_global?: number; // 1 = global, 0 = por producto
  product_id?: number;
  active?: number;
  created_at?: string;
}

class FixedCostsModel {
  /**
   * Obtiene todos los gastos fijos activos
   */
  public getAllFixedCosts(): IFixedCost[] {
    const query = `
      SELECT 
        fc.*,
        cp.name as product_name
      FROM fixed_costs fc
      LEFT JOIN cost_products cp ON fc.product_id = cp.id
      WHERE fc.active = 1
      ORDER BY fc.is_global DESC, fc.name
    `;
    return db.prepare(query).all() as IFixedCost[];
  }

  /**
   * Obtiene gastos fijos globales
   */
  public getGlobalFixedCosts(): IFixedCost[] {
    const query = `
      SELECT * FROM fixed_costs 
      WHERE is_global = 1 AND active = 1
      ORDER BY name
    `;
    return db.prepare(query).all() as IFixedCost[];
  }

  /**
   * Obtiene gastos fijos de un producto específico
   */
  public getProductFixedCosts(productId: number): IFixedCost[] {
    const query = `
      SELECT * FROM fixed_costs 
      WHERE product_id = ? AND active = 1
      ORDER BY name
    `;
    return db.prepare(query).all(productId) as IFixedCost[];
  }

  /**
   * Obtiene un gasto fijo por ID
   */
  public getFixedCostById(id: number): IFixedCost | undefined {
    return db.prepare("SELECT * FROM fixed_costs WHERE id = ?").get(id) as IFixedCost | undefined;
  }

  /**
   * Crea un nuevo gasto fijo
   */
  public createFixedCost(fixedCost: IFixedCost): { lastInsertRowid: number } {
    const {
      name,
      description,
      cost_per_item = 0,
      cost_per_minute = 0,
      is_global = 0,
      product_id
    } = fixedCost;

    const query = `
      INSERT INTO fixed_costs 
        (name, description, cost_per_item, cost_per_minute, is_global, product_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(query).run(
      name,
      description || null,
      cost_per_item,
      cost_per_minute,
      is_global,
      product_id || null
    );

    return { lastInsertRowid: result.lastInsertRowid as number };
  }

  /**
   * Actualiza un gasto fijo
   */
  public updateFixedCost(id: number, fixedCost: Partial<IFixedCost>): boolean {
    const updates: string[] = [];
    const values: any[] = [];

    if (fixedCost.name !== undefined) {
      updates.push("name = ?");
      values.push(fixedCost.name);
    }

    if (fixedCost.description !== undefined) {
      updates.push("description = ?");
      values.push(fixedCost.description);
    }

    if (fixedCost.cost_per_item !== undefined) {
      updates.push("cost_per_item = ?");
      values.push(fixedCost.cost_per_item);
    }

    if (fixedCost.cost_per_minute !== undefined) {
      updates.push("cost_per_minute = ?");
      values.push(fixedCost.cost_per_minute);
    }

    if (fixedCost.is_global !== undefined) {
      updates.push("is_global = ?");
      values.push(fixedCost.is_global);
    }

    if (fixedCost.product_id !== undefined) {
      updates.push("product_id = ?");
      values.push(fixedCost.product_id);
    }

    if (fixedCost.active !== undefined) {
      updates.push("active = ?");
      values.push(fixedCost.active);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const query = `UPDATE fixed_costs SET ${updates.join(", ")} WHERE id = ?`;
    const result = db.prepare(query).run(...values);

    return result.changes > 0;
  }

  /**
   * Elimina (desactiva) un gasto fijo
   */
  public deleteFixedCost(id: number): boolean {
    const query = `UPDATE fixed_costs SET active = 0 WHERE id = ?`;
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }
}

export default new FixedCostsModel();
