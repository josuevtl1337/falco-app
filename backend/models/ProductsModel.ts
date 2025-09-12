
// import { db } from "../db.js";
import db  from "../db.ts"; 

export interface IProduct {
  name: string;
  category_id: string;
  supplier_price: number;
  sale_price: number;
  stock_quantity: number;
  unit: number;
  supplier_id: string;
}

class ProductsModels {

  public async getAllProducts()  {
    const data = db.prepare("SELECT * FROM products").all();
    return data;
  }

  public async addNewProduct(product: IProduct) {
    const { name, category_id, supplier_price, sale_price, stock_quantity, unit, supplier_id } = product;
    const created_at = new Date().toISOString();
    
    const data = db.prepare(
      "INSERT INTO products (name, category_id, supplier_price, sale_price, stock_quantity, unit, created_at, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      name,
      category_id,
      supplier_price,
      sale_price,
      stock_quantity,
      unit,
      created_at,
      supplier_id
    );
    return data;
  }

}

export default new ProductsModels();