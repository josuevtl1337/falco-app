import type { Order } from "./OrderModel";

export class PrintModel {
  async printOrder(payload: Order): Promise<void> {
    const mod = await import("@ssxv/node-printer");
    const printerLib = mod.default ?? mod;

    const data = buildTicket(payload);

    await new Promise<void>((resolve, reject) => {
      printerLib.printDirect({
        data,
        printer: "POS58 Printer",
        type: "RAW",
        success: () => resolve(),
        error: (err: unknown) => reject(err),
      });
    });
  }
}

function buildTicket(payload: Order): string {
  const lineWidth = 32;
  const line = "-".repeat(lineWidth);
  const dateStr = new Date().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let out = "\x1B@\n"; // init impresora

  // ===== TÍTULO CENTRADO =====
  const title = "FALCO CAFE";
  const titlePad = Math.floor((lineWidth - title.length) / 2);
  out += " ".repeat(titlePad) + title + "\n";

  // ===== INFO DE ORDEN =====
  out += `Orden: #${payload.id}\n`;
  if (payload.shift) {
    out += `Turno: ${payload.shift === "afternoon" ? "Tarde" : "Maniana"}\n`;
  }
  out += `Fecha: ${dateStr}\n`;
  if (payload.table_number) {
    out += `Mesa/Banqueta: ${
      payload.table_number.includes("TA") ? "Take Away" : payload.table_number
    }\n`;
  }
  out += `${line}\n`;

  // ===== HEADER DE COLUMNAS =====
  // Anchos: 3 (cnt) | 10 (producto) | 5 (precio) | 5 (subtotal)
  const headerQty = col("Cnt", 3, "right");
  const headerName = col("Producto", 10, "left");
  const headerPrice = col("P.Uni", 5, "right");
  const headerSubt = col("Subt", 5, "right");
  out += `${headerQty} | ${headerName} | ${headerPrice} | ${headerSubt}\n`;
  out += `${line}\n`;

  // ===== ITEMS =====
  let subtotal = 0;

  for (const item of payload.items) {
    const itemSubtotal = item.subtotal;
    subtotal += itemSubtotal;

    const sanitized = sanitizeString(item.menu_item_name);

    const qtyStr = col(String(item.quantity), 3, "right");
    const nameStr = col(sanitized, 10, "left");
    const priceStr = col(String(item.unit_price), 5, "right");
    const subtotalStr = col(String(itemSubtotal), 5, "right");

    // ejemplo: "  2 | Cafe Bombo |  4800 |  9600"
    out += `${qtyStr} | ${nameStr} | ${priceStr} | ${subtotalStr}\n`;
  }

  out += `${line}\n`;

  // ===== SUBTOTAL / DESCUENTO / TOTAL =====
  const subtotalLabel = "Subtotal:";
  const subtotalAmount = `$${subtotal}`;
  out +=
    subtotalLabel +
    subtotalAmount.padStart(lineWidth - subtotalLabel.length, " ") +
    "\n";

  const discount = payload.discount_percentage ?? 0;
  const discountLabel = "Descuento:";
  const discountAmount = `%${discount}`;
  out +=
    discountLabel +
    discountAmount.padStart(lineWidth - discountLabel.length, " ") +
    "\n";

  const totalLabel = "TOTAL:";
  const totalAmount = `$${payload.total_amount}`;
  out +=
    totalLabel +
    totalAmount.padStart(lineWidth - totalLabel.length, " ") +
    "\n";

  if (payload.notes) {
    out += `${line}\n`;
    out += `Nota: ${payload.notes}\n`;
  }

  out += `${line}\n`;

  // ===== MENSAJES FINALES (SIN EMOJIS) =====
  out += "Gracias por tu visita!\n";
  out += "Seguinos en IG: @falco.cafe.st\n";

  out += "\n\n\n"; // feed papel

  return out;
}

function sanitizeString(cadena: string): string {
  const normalizeString = cadena.normalize("NFD");
  return normalizeString.replace(/[\u0300-\u036f]/g, "");
}

function col(text: string, width: number, align: "left" | "right" = "left") {
  if (align === "left") {
    return text.padEnd(width, " ").slice(0, width);
  }
  return text.padStart(width, " ").slice(0, width);
}
