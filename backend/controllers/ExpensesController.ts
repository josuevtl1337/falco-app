import type { Response, Request } from "express";
import ExpensesModel from "../models/ExpensesModel.ts";

class ExpensesController {

  public async getAllExpenses(req: Request, res: Response): Promise<void> {
    try {
      const products = await ExpensesModel.getAllExpenses();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Expenses" });
    }
  }

  public async addExpense(req: any, res: any) {
    try {
      const expense = req.body;
      const newExpense = await ExpensesModel.addNewExpense(expense);
      res.status(201).json(newExpense);
    } catch (error) {
      res.status(500).json({ error: "Failed to add product" });
    }
  }

  public async getTotalBudget(req: Request, res: Response): Promise<void> {
    try {
      const totalBudget = await ExpensesModel.getTotalBudget();
      res.status(200).json({ total: totalBudget });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch total budget" });
    }
  }

}

export default new ExpensesController();

