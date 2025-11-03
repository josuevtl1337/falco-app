
import { OrderModel, type Order } from "../models/OrderModel.ts";
import type { Response, Request } from "express";

class OrderController {
  public async createOrder(req: Request, res: Response) {
    const payload = req.body && req.body.body ? req.body.body : req.body;

    try {
      if (!payload || !payload.items || !Array.isArray(payload.items)) {
        return res.status(400).json({ success: false, message: "Invalid payload: items required" });
      }

      const orderId = OrderModel.create(payload);
      console.log("Order created:", orderId, "table:", payload.table_number);
      return res.status(201).json({ success: true, id: orderId });
    } catch (error: any) {
      console.error("Error creating order:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack,
        payload,
      });
    }
  };

  public async getAllOrders(_req: Request, res: Response) {
    try {
      const orders = OrderModel.getAll();
      res.json(orders);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
        stack: error?.stack
      });
      // res.status(500).json({ error: "Error fetching orders" });
    }
  };

  public async getOrderById(req: Request, res: Response) {
    try {
      const order = OrderModel.getById(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Error fetching order" });
    }
  };

  public async updateOrderStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const result = OrderModel.updateStatus(Number(req.params.id), status);
      if (!result.changes) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ message: "Order status updated" });
    } catch (error) {
      res.status(500).json({ error: "Error updating order status" });
    }
  };
};

export default new OrderController();