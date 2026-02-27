import { useState } from "react";
import PaymentSection, { PaymentData } from "./payment-section";
import OrderItemsList, { LineItem } from "./order-items-list";
import { Button } from "@/components/ui/button";

export default function CheckoutView({
  orderLabel,
  items,
  subtotal,
  discount,
  onClose,
  onConfirm,
  onPrint,
}: {
  orderLabel: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  total: number;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => Promise<void>;
  onPrint: (paymentData?: PaymentData) => void;
}) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  return (
    <div className="h-full w-full flex items-start justify-center">
      <div className="max-w-5xl w-full grid lg:grid-cols-3 gap-6 p-6">
        <div className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Cobro de orden</h2>
              <div className="text-sm text-gray-400">{orderLabel}</div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-[var(--card-border)] text-sm text-gray-300"
              >
                ← Volver
              </Button>
            </div>
          </div>

          <OrderItemsList items={items} />
        </div>

        <div className="col-span-2">
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-2xl p-6 flex flex-col gap-4">
            <div className="border-t border-[var(--card-border)] pt-4">
              <PaymentSection
                subtotal={subtotal - discount}
                onChange={(d) => setPaymentData(d)}
              />

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => onPrint(paymentData ?? undefined)}
                  disabled={!paymentData}
                  className="flex-1 py-2 rounded bg-gray-700 text-white font-semibold cursor-pointer"
                >
                  Imprimir ticket
                </Button>
                <Button
                  onClick={() => paymentData && onConfirm(paymentData)}
                  disabled={!paymentData}
                  className="flex-1 py-2 rounded bg-[var(--primary)] font-semibold cursor-pointer"
                >
                  Confirmar pago
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
