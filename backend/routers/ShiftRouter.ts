import { Router } from "express";
import  ShiftController  from "../controllers/ShiftController";

const router = Router();

router.post("/close-shift", ShiftController.closeShift);

export default router;