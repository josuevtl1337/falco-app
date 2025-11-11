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

  let out = "\x1B@\n"; // init
  out += "FALCO CAFE\n";
  out += `Orden: #${payload.id}\n`;
  if (payload.shift) out += `Turno: ${payload.shift === "afternoon" ? "Tarde" : "Maniana"}\n`;
  out += `Fecha: ${dateStr}\n`;
  if (payload.table_number) out += `Mesa/Banqueta: ${payload.table_number.includes("TA") ? "Take Away" : payload.table_number}\n`;
  out += `${line}\n`;

  // header de columnas, ajustado a los anchos que definimos
  out += "CantProducto      P.Unit Subtot\n";
  out += `${line}\n`;

  let subtotal = 0;

  for (const item of payload.items) {
    const itemSubtotal = item.subtotal;
    subtotal += itemSubtotal;

    // 4 chars
    const qtyStr = String(item.quantity).padEnd(4, " ");

    // 14 chars (cortamos si es más largo)
    const nameStr = item.menu_item_name.padEnd(14, " ").slice(0, 14);

    // 6 chars → "$" + precio alineado
    const priceStr = (`$${item.unit_price}`).padStart(6, " ");

    // 7 chars → "$" + subtotal item
    const itemSubtotalStr = (`$${itemSubtotal}`).padStart(7, " ");

    out += `${qtyStr}${nameStr}${priceStr}${itemSubtotalStr}\n`;
  }

  out += `${line}\n`;

  // subtotal alineado a la derecha con $ pegado al número
  const subtotalLabel = "Subtotal:";
  const subtotalAmount = `$${subtotal}`;
  out += subtotalLabel + subtotalAmount.padStart(lineWidth - subtotalLabel.length, " ") + "\n";

  const discount = payload.discount_percentage ?? 0;
  const discountLabel = "Descuento:";
  const discountAmount = `$${discount}`;
  out += discountLabel + discountAmount.padStart(lineWidth - discountLabel.length, " ") + "\n";

  const total = subtotal - discount;
  const totalLabel = "TOTAL:";
  const totalAmount = `$${total}`;
  out += totalLabel + totalAmount.padStart(lineWidth - totalLabel.length, " ") + "\n";

  if (payload.notes) {
    out += `${line}\n`;
    out += `Nota: ${payload.notes}\n`;
  }

  out += `${line}\n`;
  out += "Factura: solicitar en caja.\n";
  out += "\n\n\n\n"; // feed paper

  return out;
}