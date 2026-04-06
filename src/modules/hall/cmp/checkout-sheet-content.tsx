import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import PaymentSection, { PaymentData } from "./checkout/payment-section";
import { formatARS } from "@/modules/commons/utils/helpers";
import type { OrderStateData } from "..";

interface CheckoutSheetContentProps {
  currentOrder: OrderStateData;
  onConfirm: (paymentData: PaymentData) => Promise<void>;
  onPrint: (paymentData?: PaymentData) => void;
}

function CheckoutSheetContent({
  currentOrder,
  onConfirm,
  onPrint,
}: CheckoutSheetContentProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const handlePaymentChange = useCallback((d: PaymentData) => {
    setPaymentData(d);
  }, []);

  const subtotal = currentOrder.items.reduce(
    (acc, it) => acc + it.unit_price * it.quantity,
    0
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 px-5">
        {/* Order items */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Detalle de la orden
          </h3>
          <div className="flex flex-col gap-3">
            {currentOrder.items.map((it) => (
              <div
                key={it.menu_item_id}
                className="flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {it.menu_item_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {it.quantity} × {formatARS(it.unit_price)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white">
                  {formatARS(it.subtotal)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment section */}
        <PaymentSection
          subtotal={subtotal}
          onChange={handlePaymentChange}
        />
      </ScrollArea>

      {/* Footer actions */}
      <div className="p-4 border-t border-[var(--card-border)] flex gap-2 flex-shrink-0">
        <Button
          onClick={() => onPrint(paymentData ?? undefined)}
          disabled={!paymentData}
          variant="outline"
          className="flex-1 py-2 rounded-lg text-sm font-semibold border-[var(--card-border)] text-gray-300"
        >
          Imprimir ticket
        </Button>
        <Button
          onClick={() => paymentData && onConfirm(paymentData)}
          disabled={!paymentData}
          className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-sm font-semibold cursor-pointer"
        >
          Confirmar pago
        </Button>
      </div>
    </div>
  );
}

export default CheckoutSheetContent;
