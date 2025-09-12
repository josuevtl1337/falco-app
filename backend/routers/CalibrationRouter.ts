import { Router } from "express";
import CalibrationController from "../controllers/CalibrationController.ts";


const CalibrationRouter = Router();
// GET
CalibrationRouter.get("/calibration/get-coffees", CalibrationController.getAllCoffees);
CalibrationRouter.get("/calibration/get-calibrations", CalibrationController.getAllCalibrations);


// POST
CalibrationRouter.post("/calibration/add-tasting", CalibrationController.addTasting);
CalibrationRouter.post("/calibration/add-coffee", CalibrationController.addCoffee);

export default CalibrationRouter;