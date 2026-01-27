import { Router } from "express";
import OrderController from "../controllers/OrderController.ts";

const OrdersRouter = Router();

OrdersRouter.post("/orders", OrderController.createOrder);
OrdersRouter.get("/get-orders", OrderController.getAllOrders);
OrdersRouter.get("/get-history", OrderController.getOrderHistory);
OrdersRouter.patch("/orders/:id/status", OrderController.updateOrderStatus);
OrdersRouter.patch("/orders/:id", OrderController.updateOrder);
OrdersRouter.get("/payment-methods", OrderController.getPaymentMethods);

export default OrdersRouter;