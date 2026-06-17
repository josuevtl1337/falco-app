import { Router } from "express";
import CustomerController from "../controllers/CustomerController.ts";

const CustomerRouter = Router();

CustomerRouter.get("/customers", CustomerController.list);
CustomerRouter.post("/customers", CustomerController.create);
CustomerRouter.patch("/customers/:id", CustomerController.update);
CustomerRouter.get("/customers/:id/account", CustomerController.detail);
CustomerRouter.post("/customers/:id/payments", CustomerController.registerPayment);
CustomerRouter.patch("/orders/:orderId/customer-account", CustomerController.assignOrder);

export default CustomerRouter;
