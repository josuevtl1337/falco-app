import type { Request, Response } from "express";
import { CustomerModel } from "../models/CustomerModel.ts";

class CustomerController {
  public list(_req: Request, res: Response) {
    try {
      res.json(CustomerModel.list());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener clientes" });
    }
  }

  public create(req: Request, res: Response) {
    try {
      const customer = CustomerModel.create(req.body);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al crear cliente" });
    }
  }

  public update(req: Request, res: Response) {
    try {
      const customer = CustomerModel.update(Number(req.params.id), req.body);
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al actualizar cliente" });
    }
  }

  public detail(req: Request, res: Response) {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      res.json(CustomerModel.getDetail(Number(req.params.id), month, year));
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Error al obtener cuenta corriente" });
    }
  }

  public assignOrder(req: Request, res: Response) {
    try {
      const detail = CustomerModel.assignOrder(
        Number(req.params.orderId),
        Number(req.body.customer_id)
      );
      res.json({ success: true, detail });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al asignar comanda" });
    }
  }

  public registerPayment(req: Request, res: Response) {
    try {
      const result = CustomerModel.registerPayment({
        ...req.body,
        customer_id: Number(req.params.id),
      });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al registrar pago" });
    }
  }
}

export default new CustomerController();
