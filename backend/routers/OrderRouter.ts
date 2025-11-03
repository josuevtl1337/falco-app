import { Router } from "express";
import OrderController from "../controllers/OrderController.ts";

const OrdersRouter = Router();

OrdersRouter.post("/orders", OrderController.createOrder);
OrdersRouter.get("/orders", OrderController.getAllOrders);
// OrdersRouter.get("/orders/:id", OrderController.getOrderById);
// OrdersRouter.patch("/orders/:id/status", OrderController.updateOrderStatus);

export default OrdersRouter;