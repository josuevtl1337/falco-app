import { CashRegisterModel } from "../models/CashRegisterModel.ts";
import type { Response, Request } from "express";

class CashRegisterController {
  public getStatus(_req: Request, res: Response): void {
    try {
      const status = CashRegisterModel.getStatus();
      res.json(status);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: error.message || "Error getting cash register status" });
    }
  }

  public open(req: Request, res: Response): void {
    try {
      const { shift, cash_start, bank_start, stock_start } = req.body;

      if (!shift || !["morning", "afternoon"].includes(shift)) {
        res.status(400).json({ error: "Shift must be 'morning' or 'afternoon'" });
        return;
      }
      if (typeof cash_start !== "number" || typeof bank_start !== "number") {
        res
          .status(400)
          .json({ error: "Cash and bank amounts are required and must be numbers" });
        return;
      }
      if (!stock_start || typeof stock_start !== "object") {
        res
          .status(400)
          .json({ error: "Initial bakery stock is required" });
        return;
      }

      const register = CashRegisterModel.open({
        shift,
        cash_start,
        bank_start,
        stock_start,
      });

      res.status(201).json(register);
    } catch (error: any) {
      if (error.message?.includes("already an open")) {
        res.status(400).json({ error: error.message });
        return;
      }
      res
        .status(500)
        .json({ error: error.message || "Error opening cash register" });
    }
  }

  public async close(req: Request, res: Response): Promise<void> {
    try {
      const { register_id, cash_end, bank_end, stock_end_actual } = req.body;

      if (!register_id) {
        res.status(400).json({ error: "Register ID is required" });
        return;
      }
      if (typeof cash_end !== "number" || typeof bank_end !== "number") {
        res
          .status(400)
          .json({ error: "Closing cash and bank amounts are required and must be numbers" });
        return;
      }
      if (!stock_end_actual || typeof stock_end_actual !== "object") {
        res
          .status(400)
          .json({ error: "Final bakery stock count is required" });
        return;
      }

      const register = CashRegisterModel.close({
        register_id,
        cash_end,
        bank_end,
        stock_end_actual,
      });

      // Trigger backup after successful close
      await CashRegisterModel.triggerBackup(register.shift);

      res.json(register);
    } catch (error: any) {
      if (error.message?.includes("No open cash register")) {
        res.status(404).json({ error: error.message });
        return;
      }
      res
        .status(500)
        .json({ error: error.message || "Error closing cash register" });
    }
  }

  public getBakeryStock(_req: Request, res: Response): void {
    try {
      const stock = CashRegisterModel.getCurrentBakeryStock();
      res.json(stock);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: error.message || "Error getting bakery stock" });
    }
  }
}

export default new CashRegisterController();
