import { OrderModel, type Order } from "../models/OrderModel.ts";
import type { Response, Request } from "express";

class OrderController {
  public async createOrder(req: Request, res: Response) {
    const payload = req.body && req.body.body ? req.body.body : req.body;

    try {
      if (!payload || !payload.items || !Array.isArray(payload.items)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid payload: items required" });
      }

      const orderId = OrderModel.create(payload);
      return res.status(201).json({ success: true, newOrder: orderId });
    } catch (error: any) {
      console.error("Error creating order:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
        payload,
      });
    }
  }

  public async getAllOrders(_req: Request, res: Response) {
    try {
      const orders = OrderModel.getAll();
      res.json(orders);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
      });
    }
  }

  public async updateOrderStatus(req: Request, res: Response) {
    try {
      const payload = req.body && req.body.body ? req.body.body : req.body;
      const result = OrderModel.updateStatus(payload);

      if (!result.changes) {
        return res.status(404).json({ error: "No changes has been made" });
      }
      res.json({ message: "Order status updated" });
    } catch (error) {
      res.status(500).json({ error: "Error updating order status" });
    }
  }

  public async updateOrder(req: Request, res: Response) {
    const payload = req.body && req.body.body ? req.body.body : req.body;
    try {
      const updatedOrder = OrderModel.updateOrder(payload);
      res.json({ success: true, updatedOrder });
    } catch (error: any) {
      console.error("Error updating order:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
        payload,
      });
    }
  }

  public async getPaymentMethods(_req: Request, res: Response) {
    try {
      const paymentMethods = OrderModel.getPaymentMethods();
      res.json(paymentMethods);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
      });
    }
  }
}

export default new OrderController();
