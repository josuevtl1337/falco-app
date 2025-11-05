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
  category_id?: string;
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
          JOIN menu_category cat ON cat.category_id = menu.category_id`
      )
      .all();
    return data;
  }
}

export default new MenuModel();
