import type { Order } from './OrderModel';


export class PrintModel {
  async printOrder(payload: Order): Promise<void> {
    const mod = await import('@ssxv/node-printer');
    const printerLib = mod.default ?? mod;

    const data = buildTicket(payload);

    await new Promise<void>((resolve, reject) => {
      printerLib.printDirect({
        data,
        printer: 'POS58 Printer',
        success: () => resolve(),
        error: (err: unknown) => reject(err),
      });
    });
  }
}

function buildTicket(payload: Order): string {
  const lineWidth = 32;
  const line = '-'.repeat(lineWidth);
  const dateStr = new Date().toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let out = '\x1B@\n'; // init
  out += 'FALCO CAFE\n';
  out += `Orden: #${payload.id}\n`;
  if (payload.shift) out += `Turno: ${payload.shift}\n`;
  out += `Fecha: ${dateStr}\n`;
  if (payload.table_number) out += `Mesa/Banqueta: ${payload.table_number}\n`;
  out += `${line}\n`;
  out += 'Cant  Producto           P.Unit\n';
  out += `${line}\n`;

  let subtotal = 0;
  for (const item of payload.items) {
    const unit = item.unit_price ?? 0;
    const totalItem = unit * item.quantity;
    subtotal += totalItem;

    const qtyStr = String(item.quantity).padEnd(4, ' ');
    const nameStr = item.menu_item_name.padEnd(15, ' ').slice(0, 15);
    const priceStr = String(unit).padStart(7, ' ');
    out += `${qtyStr}${nameStr}${priceStr}\n`;
  }

  out += `${line}\n`;
  out += `Subtotal:${subtotal.toString().padStart(lineWidth - 9, ' ')}\n`;
  const discount = payload.discount_percentage ?? 0;
  out += `Descuento:${discount.toString().padStart(lineWidth - 10, ' ')}\n`;
  const total = subtotal - discount;
  out += `TOTAL:${total.toString().padStart(lineWidth - 6, ' ')}\n`;

  if (payload.notes) {
    out += `${line}\n`;
    out += `Nota: ${payload.notes}\n`;
  }

  out += `${line}\n`;
  out += '(no válido como ticket)\n';
  out += '\n\n\n\n'; // feed paper

  return out;
}
