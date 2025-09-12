// const db = require("../db");
// const router = express.Router();
import { Router } from "express";
import ProductController  from "../controllers/ProductsController.ts";
// // Listar productos
// router.get("/products", (req, res) => {
//   const products = db.prepare("SELECT * FROM products").all();
//   res.json(products);
// });

// // Crear producto
// router.post("/products/add-product", (req, res) => {
//   const { name, purchase_price, sale_price, stock_quantity, unit } = req.body;
//   const stmt = db.prepare(`
//     INSERT INTO products (name, purchase_price, sale_price, stock_quantity, unit)
//     VALUES (?, ?, ?, ?, ?)
//   `);
//   const info = stmt.run(name, purchase_price, sale_price, stock_quantity, unit);
//   res.json({ id: info.lastInsertRowid });
// });

// // Eliminar producto
// router.delete("/products/:id", (req, res) => {
//   db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
//   res.json({ success: true });
// });

// module.exports = router;

const ProductsRouter = Router();
ProductsRouter.get("/products", ProductController.getAllProducts);
ProductsRouter.post("/products/add-product", ProductController.addProduct);

export default ProductsRouter;