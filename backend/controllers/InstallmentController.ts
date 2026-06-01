import { InstallmentModel } from "../models/InstallmentModel.ts";
import type { Response, Request } from "express";

class InstallmentController {
  public getAll(_req: Request, res: Response): void {
    try {
      res.json(InstallmentModel.getAll());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener cuotas" });
    }
  }

  public create(req: Request, res: Response): void {
    try {
      const { name, monthly_amount, due_day, total_months, start_month, start_year, category } = req.body;
      if (!name || monthly_amount === undefined || !total_months || !start_month || !start_year) {
        res.status(400).json({ error: "name, monthly_amount, total_months, start_month y start_year son requeridos" });
        return;
      }

      const installment = InstallmentModel.create({
        name,
        monthly_amount,
        due_day: due_day ?? 1,
        total_months,
        start_month,
        start_year,
        category,
      });
      res.status(201).json(installment);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe una cuota con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al crear cuota" });
    }
  }

  public update(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { name, monthly_amount, due_day, total_months, start_month, start_year, category } = req.body;
      const result = InstallmentModel.update(id, {
        name,
        monthly_amount,
        due_day,
        total_months,
        start_month,
        start_year,
        category,
      });
      if (!result.changes) {
        res.status(404).json({ error: "Cuota no encontrada" });
        return;
      }
      res.json({ message: "Cuota actualizada" });
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe una cuota con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al actualizar cuota" });
    }
  }

  public delete(req: Request, res: Response): void {
    try {
      const result = InstallmentModel.delete(Number(req.params.id));
      if (!result.changes) {
        res.status(404).json({ error: "Cuota no encontrada" });
        return;
      }
      res.json({ message: "Cuota eliminada" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al eliminar cuota" });
    }
  }

  public getPaymentsForMonth(req: Request, res: Response): void {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!month || !year) {
        res.status(400).json({ error: "month y year son requeridos" });
        return;
      }
      res.json(InstallmentModel.getPaymentsForMonth(month, year));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener pagos de cuotas" });
    }
  }

  public addPayment(req: Request, res: Response): void {
    try {
      const { installment_id, month, year, amount_paid, payment_date, notes } = req.body;
      if (!installment_id || !month || !year || amount_paid === undefined || !payment_date) {
        res.status(400).json({ error: "installment_id, month, year, amount_paid y payment_date son requeridos" });
        return;
      }
      const payment = InstallmentModel.addPayment({
        installment_id,
        month,
        year,
        amount_paid,
        payment_date,
        notes,
      });
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al registrar pago de cuota" });
    }
  }

  public deletePayment(req: Request, res: Response): void {
    try {
      const result = InstallmentModel.deletePayment(Number(req.params.id));
      if (!result.changes) {
        res.status(404).json({ error: "Pago de cuota no encontrado" });
        return;
      }
      res.json({ message: "Pago de cuota eliminado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al eliminar pago de cuota" });
    }
  }

  public getMonthlySummary(req: Request, res: Response): void {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!month || !year) {
        res.status(400).json({ error: "month y year son requeridos" });
        return;
      }
      res.json(InstallmentModel.getMonthlySummary(month, year));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener resumen de cuotas" });
    }
  }
}

export default new InstallmentController();
