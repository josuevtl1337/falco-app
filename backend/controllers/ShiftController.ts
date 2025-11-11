import type { Response, Request } from "express";
import ShiftModel from "../models/ShiftModel";

class ShiftController {
  public async closeShift(req: Request, res: Response): Promise<void> {
    try {
      const { shift } = req.body;
      await ShiftModel.closeShift(shift);
      res.status(200).json({ message: "Shift closed successfully" });
    } catch (error : any) {
      console.error("Error updating order:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
      });

    }
  }
}

export default new ShiftController();
