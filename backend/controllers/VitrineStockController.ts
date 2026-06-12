import { VitrineStockModel } from "../models/VitrineStockModel.ts";
import type { Response, Request } from "express";


function getDefaultUnitStep(label: string) {
  return label.trim().toLowerCase() === "pan de molde" ? 0.5 : 1;
}

class VitrineStockController {
  public getAll(_req: Request, res: Response): void {
    try {
      res.json(VitrineStockModel.getAll());
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener stock de vitrina" });
    }
  }

  public create(req: Request, res: Response): void {
    try {
      const { label, show_on_open, show_on_close, sort_order } = req.body;
      if (!label || !String(label).trim()) {
        res.status(400).json({ error: "El nombre es requerido" });
        return;
      }

      const item = VitrineStockModel.create({
        label: String(label).trim(),
        unit_step: getDefaultUnitStep(String(label)),
        show_on_open: show_on_open ? 1 : 0,
        show_on_close: show_on_close ? 1 : 0,
        sort_order: Number(sort_order) || 0,
      });

      res.status(201).json(item);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe un item de vitrina con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al crear item de vitrina" });
    }
  }

  public update(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { label, show_on_open, show_on_close, sort_order } = req.body;
      if (!label || !String(label).trim()) {
        res.status(400).json({ error: "El nombre es requerido" });
        return;
      }

      const result = VitrineStockModel.update(id, {
        label: String(label).trim(),
        unit_step: getDefaultUnitStep(String(label)),
        show_on_open: show_on_open ? 1 : 0,
        show_on_close: show_on_close ? 1 : 0,
        sort_order: Number(sort_order) || 0,
      });

      if (!result.changes) {
        res.status(404).json({ error: "Item de vitrina no encontrado" });
        return;
      }

      res.json({ message: "Item de vitrina actualizado" });
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        res.status(400).json({ error: "Ya existe un item de vitrina con ese nombre" });
        return;
      }
      res.status(500).json({ error: error.message || "Error al actualizar item de vitrina" });
    }
  }

  public toggleActive(req: Request, res: Response): void {
    try {
      const id = Number(req.params.id);
      const { active } = req.body;
      const result = VitrineStockModel.toggleActive(id, active ? 1 : 0);
      if (!result.changes) {
        res.status(404).json({ error: "Item de vitrina no encontrado" });
        return;
      }
      res.json({ message: active ? "Item activado" : "Item desactivado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al cambiar estado" });
    }
  }

  public getMappings(req: Request, res: Response): void {
    try {
      res.json(VitrineStockModel.getMappingsByItemId(Number(req.params.id)));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener mapeos" });
    }
  }

  public setMappings(req: Request, res: Response): void {
    try {
      const rawMappings = req.body.mappings;
      const menuItemIds = req.body.menu_item_ids;
      const mappings = Array.isArray(rawMappings)
        ? rawMappings.map((mapping) => ({
            menu_item_id: Number(mapping.menu_item_id),
            quantity_per_item: Number(mapping.quantity_per_item) || 1,
          }))
        : Array.isArray(menuItemIds)
          ? menuItemIds.map((menuItemId) => ({
              menu_item_id: Number(menuItemId),
              quantity_per_item: 1,
            }))
          : null;

      if (!mappings) {
        res.status(400).json({ error: "mappings debe ser un array" });
        return;
      }

      VitrineStockModel.setMappings(Number(req.params.id), mappings);
      res.json({ message: "Mapeos de vitrina actualizados" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al actualizar mapeos de vitrina" });
    }
  }
}

const vitrineStockController = new VitrineStockController();

export default vitrineStockController;
