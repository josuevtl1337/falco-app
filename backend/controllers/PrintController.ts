import type { Response, Request } from "express";
import { PrintModel } from "../models/PrintModel";

const printService = new PrintModel();

export class PrintController {
  static async printOrder(req: Request, res: Response) {
    try {
      const payload = req.body && req.body.body ? req.body.body : req.body;
      console.log(payload);
      if (!payload.id) {
        return res
          .status(400)
          .json({ message: "orderId e items son obligatorios" });
      }

      await printService.printOrder(payload);

      return res.json({ ok: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: "Error al imprimir" });
    }
  }

  static async listPrinters(req: Request, res: Response) {
    const mod = await import("@ssxv/node-printer");
    const printer = mod.default ?? mod;

    const printers = await printer.getPrinters();
    return res.json(printers);
  }
}
