import type { Response, Request } from "express";
import ProductsModel from "../models/ProductsModel.ts";

class ProductController {

  public async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await ProductsModel.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  public async addProduct(req: any, res: any) {
    try {
      const product = req.body;
      const newProduct = await ProductsModel.addNewProduct(product);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to add product" });
    }
  }

  // Additional methods for update and delete can be added here
}

export default new ProductController();

