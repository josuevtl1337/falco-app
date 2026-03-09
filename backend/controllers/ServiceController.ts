import { ServiceModel } from "../models/ServiceModel.ts";
import type { Response, Request } from "express";

class ServiceController {
  // ─── Service CRUD ───

  public getAll(_req: Request, res: Response): void {
    try {
      res.json(ServiceModel.getAll());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener servicios" });
    }
  }

  public getById(req: Request, res: Response): void {
    try {
      const service = ServiceModel.getById(Number(req.params.id));
      if (!service) {
        res.status(404).json({ error: "Servicio no encontrado" });
        return;
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener servicio" });
    }
  }

  public create(req: Request, res: Response): void {
    try {
      const { name, monthly_amount, due_day, category, icon } = req.body;
      if (!name) {
        res.status(400).json({ error: "El nombre es requerido" });
        return;
      }
      const service = ServiceModel.create({
        name,
        monthly_amount: monthly_amount ?? 0,
        due_day: due_day ?? 1,
        category: category || "general",
        icon: icon || "bolt",
      });
      res.status(201).json(service);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe un servicio con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al crear servicio" });
    }
  }

  public update(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { name, monthly_amount, due_day, category, icon } = req.body;
      const result = ServiceModel.update(id, { name, monthly_amount, due_day, category, icon });
      if (!result.changes) {
        res.status(404).json({ error: "Servicio no encontrado" });
        return;
      }
      res.json({ message: "Servicio actualizado" });
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe un servicio con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al actualizar servicio" });
    }
  }

  public delete(req: Request, res: Response): void {
    try {
      const result = ServiceModel.delete(Number(req.params.id));
      if (!result.changes) {
        res.status(404).json({ error: "Servicio no encontrado" });
        return;
      }
      res.json({ message: "Servicio eliminado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al eliminar servicio" });
    }
  }

  public toggleActive(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { active } = req.body;
      const result = ServiceModel.toggleActive(id, active ? 1 : 0);
      if (!result.changes) {
        res.status(404).json({ error: "Servicio no encontrado" });
        return;
      }
      res.json({ message: active ? "Servicio activado" : "Servicio desactivado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al cambiar estado" });
    }
  }

  // ─── Payments ───

  public getPaymentsForMonth(req: Request, res: Response): void {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!month || !year) {
        res.status(400).json({ error: "month y year son requeridos" });
        return;
      }
      res.json(ServiceModel.getPaymentsForMonth(month, year));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener pagos" });
    }
  }

  public addPayment(req: Request, res: Response): void {
    try {
      const { service_id, month, year, amount_paid, payment_date, notes } = req.body;
      if (!service_id || !month || !year || amount_paid === undefined || !payment_date) {
        res.status(400).json({ error: "service_id, month, year, amount_paid y payment_date son requeridos" });
        return;
      }
      const payment = ServiceModel.addPayment({
        service_id,
        month,
        year,
        amount_paid,
        payment_date,
        notes,
      });
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al registrar pago" });
    }
  }

  public deletePayment(req: Request, res: Response): void {
    try {
      const result = ServiceModel.deletePayment(Number(req.params.id));
      if (!result.changes) {
        res.status(404).json({ error: "Pago no encontrado" });
        return;
      }
      res.json({ message: "Pago eliminado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al eliminar pago" });
    }
  }

  public getPaymentHistory(req: Request, res: Response): void {
    try {
      const serviceId = Number(req.params.id);
      res.json(ServiceModel.getPaymentHistory(serviceId));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener historial" });
    }
  }

  // ─── Summaries ───

  public getMonthlySummary(req: Request, res: Response): void {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!month || !year) {
        res.status(400).json({ error: "month y year son requeridos" });
        return;
      }
      res.json(ServiceModel.getMonthlySummary(month, year));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener resumen" });
    }
  }

  public getAnnualSummary(req: Request, res: Response): void {
    try {
      const year = Number(req.query.year);
      if (!year) {
        res.status(400).json({ error: "year es requerido" });
        return;
      }
      res.json(ServiceModel.getAnnualSummary(year));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener resumen anual" });
    }
  }
}

export default new ServiceController();
