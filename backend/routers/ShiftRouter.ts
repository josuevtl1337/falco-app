import { Router } from "express";
import  ShiftController  from "../controllers/ShiftController.ts";

const router = Router();

router.post("/close-shift", ShiftController.closeShift);

export default router;
