import { Router } from "express";
import ReportController from "../controllers/ReportController";

const router = Router();

// Existing — Resumen module
router.get("/report/report-daily", ReportController.getDailyReport);

// New — Reportes module
router.get("/report/monthly", ReportController.getMonthlyReport);
router.get("/report/monthly-range", ReportController.getMonthlyRangeReport);
router.get("/report/chart-data", ReportController.getChartData);
router.get("/report/product-ranking", ReportController.getProductRanking);
router.get("/report/expenses", ReportController.getExpenses);
router.post("/report/expenses", ReportController.addExpense);
router.delete("/report/expenses/:id", ReportController.deleteExpense);

export default router;