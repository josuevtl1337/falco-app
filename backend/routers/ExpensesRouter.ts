import { Router } from "express";
import ProductController  from "../controllers/ProductsController.ts";
import ExpensesController from "../controllers/ExpensesController.ts";


const ProductsRouter = Router();
ProductsRouter.get("/expenses", ExpensesController.getAllExpenses);
ProductsRouter.post("/expenses/add-expense", ExpensesController.addExpense);
ProductsRouter.get("/expenses/total-budget", ExpensesController.getTotalBudget);

export default ProductsRouter;