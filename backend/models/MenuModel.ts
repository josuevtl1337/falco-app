import db from "../db.ts";

export interface IMenuItem {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  price: number;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  category_id?: string | number;
  category_name?: string;
}

class MenuModel {
  public async getAllMenuItems() {
    const data = db
      .prepare(
        `SELECT 
          menu.id,
          menu.slug,
          menu.name,
          menu.description,
          menu.price,
          menu.is_active,
          menu.created_at,
          menu.updated_at, 
          menu.category_id, 
          cat.name as category_name
          FROM menu_items menu
          JOIN menu_category cat ON cat.category_id = menu.category_id`,
      )
      .all();
    return data;
  }

  public async createMenuItem(
    item: Omit<IMenuItem, "id" | "created_at" | "updated_at">,
  ) {
    const stmt = db.prepare(`
      INSERT INTO menu_items (slug, name, description, price, is_active, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      item.slug,
      item.name,
      item.description,
      item.price,
      item.is_active || 1,
      item.category_id,
    );

    return result.lastInsertRowid;
  }

  public async updateMenuItem(
    id: string,
    item: Partial<Omit<IMenuItem, "id" | "created_at" | "updated_at">>,
  ) {
    const fields = [];
    const values = [];

    if (item.slug !== undefined) {
      fields.push("slug = ?");
      values.push(item.slug);
    }
    if (item.name !== undefined) {
      fields.push("name = ?");
      values.push(item.name);
    }
    if (item.description !== undefined) {
      fields.push("description = ?");
      values.push(item.description);
    }
    if (item.price !== undefined) {
      fields.push("price = ?");
      values.push(item.price);
    }
    if (item.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(item.is_active);
    }
    if (item.category_id !== undefined) {
      fields.push("category_id = ?");
      values.push(item.category_id);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE menu_items 
      SET ${fields.join(", ")}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  public async deleteMenuItem(id: string) {
    const stmt = db.prepare("DELETE FROM menu_items WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  public async getMenuItemById(id: string) {
    const data = db
      .prepare(
        `SELECT 
          menu.id,
          menu.slug,
          menu.name,
          menu.description,
          menu.price,
          menu.is_active,
          menu.created_at,
          menu.updated_at, 
          menu.category_id, 
          cat.name as category_name
          FROM menu_items menu
          JOIN menu_category cat ON cat.category_id = menu.category_id
          WHERE menu.id = ?`,
      )
      .get(id);
    return data;
  }

  public async getCategories() {
    const data = db
      .prepare("SELECT category_id, name FROM menu_category ORDER BY name")
      .all();
    return data;
  }
}

export default new MenuModel();
