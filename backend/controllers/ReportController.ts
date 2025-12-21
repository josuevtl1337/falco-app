import type { Response, Request } from "express";
import ReportModel from "../models/ReportModel.ts";

class ReportController {
  public async getDailyReport(req: Request, res: Response): Promise<void> {
   
    try {
      const dateParam = (req.query?.date as string) || new Date().toISOString().slice(0, 10);
      const report = await ReportModel.getDailyReport(dateParam);
      res.status(200).json({ date: dateParam, ...report });

    } catch (error:any) {
      console.error("ReportController.getDailyReport error:", error);
        res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
      });

    }
  }
}

export default new ReportController();

