import type { Response, Request } from "express";
import SuppliersModel from "../models/SuppliersModel.ts";

class SuppliersController {
  /**
   * GET /api/cost-engine/suppliers
   * Obtiene todos los proveedores
   */
  public async getAllSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = SuppliersModel.getAllSuppliers();
      res.status(200).json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  }

  /**
   * GET /api/cost-engine/suppliers/:id
   * Obtiene un proveedor por ID
   */
  public async getSupplierById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const supplier = SuppliersModel.getSupplierById(id);

      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      res.status(200).json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  }

  /**
   * POST /api/cost-engine/suppliers
   * Crea un nuevo proveedor
   */
  public async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      const supplier = req.body;
      const result = SuppliersModel.createSupplier(supplier);
      res.status(201).json({ id: result.lastInsertRowid, ...supplier });
    } catch (error: any) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ error: "Failed to create supplier", message: error?.message });
    }
  }

  /**
   * PUT /api/cost-engine/suppliers/:id
   * Actualiza un proveedor
   */
  public async updateSupplier(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const supplier = req.body;

      const updated = SuppliersModel.updateSupplier(id, supplier);

      if (!updated) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      const updatedSupplier = SuppliersModel.getSupplierById(id);
      res.status(200).json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  }

  /**
   * DELETE /api/cost-engine/suppliers/:id
   * Elimina (desactiva) un proveedor
   */
  public async deleteSupplier(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = SuppliersModel.deleteSupplier(id);

      if (!deleted) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      res.status(200).json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  }
}

export default new SuppliersController();
