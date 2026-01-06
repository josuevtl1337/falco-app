import db from "../db.ts";

export interface ISupplier {
  id?: number;
  name: string;
  contact_info?: string;
  active?: number;
  created_at?: string;
}

class SuppliersModel {
  /**
   * Obtiene todos los proveedores activos
   */
  public getAllSuppliers(): ISupplier[] {
    const query = `
      SELECT * FROM suppliers 
      WHERE active = 1 
      ORDER BY name
    `;
    return db.prepare(query).all() as ISupplier[];
  }

  /**
   * Obtiene un proveedor por ID
   */
  public getSupplierById(id: number): ISupplier | undefined {
    return db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as ISupplier | undefined;
  }

  /**
   * Crea un nuevo proveedor
   */
  public createSupplier(supplier: ISupplier): { lastInsertRowid: number } {
    const { name, contact_info } = supplier;
    const created_at = new Date().toISOString();
    const query = `
      INSERT INTO suppliers (name, contact_info, created_at) 
      VALUES (?, ?, ?)
    `;
    const result = db.prepare(query).run(name, contact_info || null, created_at);
    return { lastInsertRowid: result.lastInsertRowid as number };
  }

  /**
   * Actualiza un proveedor
   */
  public updateSupplier(id: number, supplier: Partial<ISupplier>): boolean {
    const updates: string[] = [];
    const values: any[] = [];

    if (supplier.name !== undefined) {
      updates.push("name = ?");
      values.push(supplier.name);
    }

    if (supplier.contact_info !== undefined) {
      updates.push("contact_info = ?");
      values.push(supplier.contact_info);
    }

    if (supplier.active !== undefined) {
      updates.push("active = ?");
      values.push(supplier.active);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const query = `UPDATE suppliers SET ${updates.join(", ")} WHERE id = ?`;
    const result = db.prepare(query).run(...values);

    return result.changes > 0;
  }

  /**
   * Elimina (desactiva) un proveedor
   */
  public deleteSupplier(id: number): boolean {
    const query = `UPDATE suppliers SET active = 0 WHERE id = ?`;
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }
}

const suppliersModel = new SuppliersModel();
export default suppliersModel;
