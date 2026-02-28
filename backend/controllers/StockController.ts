import { StockModel } from "../models/StockModel.ts";
import type { Response, Request } from "express";

class StockController {
  // ─── Stock Products CRUD ───

  public getAll(_req: Request, res: Response): void {
    try {
      res.json(StockModel.getAll());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener productos de stock" });
    }
  }

  public getById(req: Request, res: Response): void {
    try {
      const product = StockModel.getById(Number(req.params.id));
      if (!product) {
        res.status(404).json({ error: "Producto de stock no encontrado" });
        return;
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener producto" });
    }
  }

  public create(req: Request, res: Response): void {
    try {
      const { name, current_stock, alert_threshold } = req.body;
      if (!name) {
        res.status(400).json({ error: "El nombre es requerido" });
        return;
      }
      const product = StockModel.create({
        name,
        current_stock: current_stock ?? 0,
        alert_threshold: alert_threshold ?? 5,
      });
      res.status(201).json(product);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe un producto con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al crear producto" });
    }
  }

  public update(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { name, alert_threshold } = req.body;
      if (!name) {
        res.status(400).json({ error: "El nombre es requerido" });
        return;
      }
      const result = StockModel.update(id, { name, alert_threshold });
      if (!result.changes) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.json({ message: "Producto actualizado" });
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe un producto con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al actualizar producto" });
    }
  }

  public toggleActive(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { active } = req.body;
      const result = StockModel.toggleActive(id, active ? 1 : 0);
      if (!result.changes) {
        res.status(404).json({ error: "Producto no encontrado" });
        return;
      }
      res.json({ message: active ? "Producto activado" : "Producto desactivado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al cambiar estado" });
    }
  }

  // ─── Menu Item Mapping ───

  public getMappings(req: Request, res: Response): void {
    try {
      res.json(StockModel.getMappingsByProductId(Number(req.params.id)));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener mapeos" });
    }
  }

  public setMappings(req: Request, res: Response): void {
    try {
      const { menu_item_ids } = req.body;
      if (!Array.isArray(menu_item_ids)) {
        res.status(400).json({ error: "menu_item_ids debe ser un array" });
        return;
      }
      StockModel.setMappings(Number(req.params.id), menu_item_ids);
      res.json({ message: "Mapeos actualizados" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al actualizar mapeos" });
    }
  }

  // ─── Stock Replenishment ───

  public replenish(req: Request, res: Response): void {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity <= 0) {
        res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
        return;
      }
      res.json(StockModel.replenish(Number(req.params.id), quantity));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al reponer stock" });
    }
  }

  // ─── Low Stock Alerts ───

  public getLowStockAlerts(_req: Request, res: Response): void {
    try {
      res.json(StockModel.getLowStockAlerts());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener alertas" });
    }
  }

  // ─── Movement History ───

  public getMovements(req: Request, res: Response): void {
    try {
      const productId = req.params.id ? Number(req.params.id) : undefined;
      const movements = productId
        ? StockModel.getMovementsByProductId(productId)
        : StockModel.getAllMovements();
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener movimientos" });
    }
  }
}

export default new StockController();
