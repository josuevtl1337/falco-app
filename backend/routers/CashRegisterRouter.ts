import { Router } from "express";
import CashRegisterController from "../controllers/CashRegisterController.ts";

const CashRegisterRouter = Router();

CashRegisterRouter.get("/cash-register/status", CashRegisterController.getStatus);
CashRegisterRouter.post("/cash-register/open", CashRegisterController.open);
CashRegisterRouter.post("/cash-register/close", CashRegisterController.close);
CashRegisterRouter.get("/cash-register/bakery-stock", CashRegisterController.getBakeryStock);

export default CashRegisterRouter;
