import type { Request, Response } from "express";
import CalibrationModel from "../models/CalibrationModel.ts";

class CalibrationController {
  public async getAllCoffees(req: any, res: any) {
    try {
      const allCoffees = await CalibrationModel.getAllCoffees();
      res.status(201).json(allCoffees);
    } catch (error) {
      res.status(500).json({ error: "Failed to get all coffees" });
    }
  }

  public async addCoffee(req: any, res: any) {
    try {
      const coffee = req.body;
      const newCoffee = await CalibrationModel.addNewCoffee(coffee);
      res.status(201).json(newCoffee);
    } catch (error) {
      res.status(500).json({ error: "Failed to add coffee" });
    }
  }

  public async addTasting(req: Request, res: Response) {
    try {
      const tast = req.body;
      const newTast = await CalibrationModel.addNewTasting(tast);
      res.status(201).json(newTast);
    } catch (error) {
      res.status(500).json({ error: "Failed to add tast" });
    }
  }

public async getAllCalibrations(req: Request, res: Response) {
  try {
    const result = await CalibrationModel.listCalibrations(req.query);
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: "FAILED_TO_GET_CALIBRATIONS", detail: e?.message });
  }
}
}

export default new CalibrationController();
