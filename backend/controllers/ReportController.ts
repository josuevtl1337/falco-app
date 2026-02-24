import type { Response, Request } from "express";
import ReportModel from "../models/ReportModel.ts";

class ReportController {
  // =========================================
  // EXISTING — used by Resumen module
  // =========================================
  public async getDailyReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportModel.getDailyReport(
        req.query.date as string,
        req.query.shift as string
      );
      res.status(200).json({ ...report });
    } catch (error: any) {
      console.error("ReportController.getDailyReport error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  }

  // =========================================
  // NEW — Reportes module
  // =========================================

  /**
   * GET /api/report/monthly?month=2&year=2026
   * Full monthly summary: income, expenses, net profit, variation
   */
  public async getMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      // Current month data
      const income = ReportModel.getMonthlyIncome(month, year);
      const expenseSummary = ReportModel.getMonthlyExpenseSummary(month, year);
      const netProfit = income.total - expenseSummary.total;

      // Previous month for comparison
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
      const prevIncome = ReportModel.getMonthlyIncome(prevMonth, prevYear);
      const prevExpense = ReportModel.getMonthlyExpenseSummary(prevMonth, prevYear);
      const prevProfit = prevIncome.total - prevExpense.total;

      // Calculate variations
      const calcVariation = (current: number, previous: number): number | null => {
        if (previous === 0) return current > 0 ? 100 : null;
        return ((current - previous) / previous) * 100;
      };

      const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ];

      res.status(200).json({
        period: {
          month,
          year,
          label: `${monthNames[month - 1]} ${year}`,
        },
        income: {
          total: income.total,
          orderCount: income.count,
          avgTicket: income.avg,
        },
        expenses: {
          total: expenseSummary.total,
          byCategory: expenseSummary.byCategory,
        },
        netProfit,
        variation: {
          incomePercent: calcVariation(income.total, prevIncome.total),
          expensesPercent: calcVariation(expenseSummary.total, prevExpense.total),
          profitPercent: calcVariation(netProfit, prevProfit),
        },
      });
    } catch (error: any) {
      console.error("ReportController.getMonthlyReport error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }

  /**
   * GET /api/report/monthly-range?from=2026-02-01&to=2026-02-23
   */
  public async getMonthlyRangeReport(req: Request, res: Response): Promise<void> {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) {
        res.status(400).json({ error: "from and to query params are required" });
        return;
      }

      const income = ReportModel.getIncomeForRange(from, to);
      const expenseSummary = ReportModel.getExpensesForRange(from, to);
      const netProfit = income.total - expenseSummary.total;

      res.status(200).json({
        from,
        to,
        income: {
          total: income.total,
          orderCount: income.count,
          avgTicket: income.avg,
        },
        expenses: {
          total: expenseSummary.total,
          byCategory: expenseSummary.byCategory,
        },
        netProfit,
      });
    } catch (error: any) {
      console.error("ReportController.getMonthlyRangeReport error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }

  /**
   * GET /api/report/chart-data?months=12
   */
  public async getChartData(req: Request, res: Response): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const incomeHistory = ReportModel.getMonthlyIncomeHistory(months);
      const expenseHistory = ReportModel.getMonthlyExpenseHistory(months);

      // Merge into a single timeline
      const merged = new Map<string, { month: string; monthNum: number; year: number; income: number; expenses: number; profit: number }>();

      for (const item of incomeHistory) {
        const key = `${item.year}-${item.monthNum}`;
        merged.set(key, {
          month: item.month,
          monthNum: item.monthNum,
          year: item.year,
          income: item.total,
          expenses: 0,
          profit: item.total,
        });
      }

      for (const item of expenseHistory) {
        const key = `${item.year}-${item.monthNum}`;
        if (merged.has(key)) {
          const existing = merged.get(key)!;
          existing.expenses = item.total;
          existing.profit = existing.income - item.total;
        } else {
          merged.set(key, {
            month: item.month,
            monthNum: item.monthNum,
            year: item.year,
            income: 0,
            expenses: item.total,
            profit: -item.total,
          });
        }
      }

      // Sort by date
      const result = Array.from(merged.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("ReportController.getChartData error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }

  /**
   * GET /api/report/product-ranking?month=2&year=2026&order=top
   */
  public async getProductRanking(req: Request, res: Response): Promise<void> {
    try {
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const order = (req.query.order as string) === "bottom" ? "bottom" : "top";

      const ranking = ReportModel.getProductRanking(month, year, order);
      res.status(200).json(ranking);
    } catch (error: any) {
      console.error("ReportController.getProductRanking error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }

  // ---- Expenses CRUD ----

  /**
   * GET /api/report/expenses?month=2&year=2026
   */
  public async getExpenses(req: Request, res: Response): Promise<void> {
    try {
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const expenses = ReportModel.getExpensesList(month, year);
      res.status(200).json(expenses);
    } catch (error: any) {
      console.error("ReportController.getExpenses error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }

  /**
   * POST /api/report/expenses
   */
  public async addExpense(req: Request, res: Response): Promise<void> {
    try {
      const { amount, category, description, date } = req.body;
      if (!amount || !category || !date) {
        res.status(400).json({ error: "amount, category and date are required" });
        return;
      }
      const result = ReportModel.addExpense({ amount, category, description, date });
      res.status(201).json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      console.error("ReportController.addExpense error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }

  /**
   * DELETE /api/report/expenses/:id
   */
  public async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (!id) {
        res.status(400).json({ error: "Valid id is required" });
        return;
      }
      ReportModel.deleteExpense(id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("ReportController.deleteExpense error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  }
}

export default new ReportController();
