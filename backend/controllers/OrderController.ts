import { OrderModel, type Order } from "../models/OrderModel.ts";
import { StockModel } from "../models/StockModel.ts";
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

  public async getOrderHistory(req: Request, res: Response) {
    try {
      const date = req.query.date as string | undefined;
      // If no date is provided, maybe default to today? Or all history?
      // For now, if no date, return all history (be careful with size).
      // Let's interpret no date as "all", or client must ensure they send it.
      const orders = OrderModel.getHistory({ date });
      res.json(orders);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  }

  public async updateOrderStatus(req: Request, res: Response) {
    try {
      const payload = req.body && req.body.body ? req.body.body : req.body;

      // If paying, deduct stock BEFORE updating order status (atomic validation)
      if (payload.status === "paid" && payload.id) {
        try {
          StockModel.deductStockForOrder(Number(payload.id));
        } catch (stockError: any) {
          // If stock insufficient, return error without updating order
          return res.status(400).json({
            error: "Stock insuficiente",
            message: stockError.message,
          });
        }
      }

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
