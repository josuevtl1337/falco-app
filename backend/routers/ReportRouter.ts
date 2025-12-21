import { Router } from "express";
import ReportController from "../controllers/ReportController";

const router = Router();

router.get("/report/report-daily", ReportController.getDailyReport);

export default router;