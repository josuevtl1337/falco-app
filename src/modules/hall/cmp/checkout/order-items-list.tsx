import React from "react";

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  subtotal?: number;
}

export function OrderItemsList({ items }: { items: LineItem[] }) {
  return (
    <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">
        Detalle de la orden
      </h3>
      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <div key={it.id} className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-white">{it.name}</div>
              <div className="text-xs text-gray-400">
                {it.qty} × ${it.price.toLocaleString()}
              </div>
            </div>
            <div className="text-sm font-semibold text-white">
              ${((it.subtotal ?? it.price * it.qty) || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderItemsList;
