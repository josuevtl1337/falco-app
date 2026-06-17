import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import PaymentSection, {
  PaymentData,
  PaymentSummary,
} from "./checkout/payment-section";
import { formatARS } from "@/modules/commons/utils/helpers";
import type { OrderStateData } from "..";

export interface SplitPaymentItem {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CheckoutSheetContentProps {
  currentOrder: OrderStateData;
  onConfirm: (
    paymentData: PaymentData,
    splitItems?: SplitPaymentItem[],
  ) => Promise<void>;
  onPrint: (paymentData?: PaymentSummary, splitItems?: SplitPaymentItem[]) => void;
}

function CheckoutSheetContent({
  currentOrder,
  onConfirm,
  onPrint,
}: CheckoutSheetContentProps) {
  const [paymentData, setPaymentData] = useState<PaymentSummary | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitQuantities, setSplitQuantities] = useState<Record<string, number>>({});

  const handlePaymentChange = useCallback((d: PaymentSummary) => {
    setPaymentData(d);
  }, []);

  const orderSubtotal = currentOrder.items.reduce(
    (acc, it) => acc + it.unit_price * it.quantity,
    0,
  );

  const splitItems = useMemo(
    () =>
      currentOrder.items
        .map((item) => {
          const quantity = Number(splitQuantities[item.menu_item_id] || 0);
          return {
            menu_item_id: item.menu_item_id,
            menu_item_name: item.menu_item_name,
            quantity,
            unit_price: item.unit_price,
            subtotal: quantity * item.unit_price,
          };
        })
        .filter((item) => item.quantity > 0),
    [currentOrder.items, splitQuantities],
  );

  const splitSubtotal = splitItems.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotal = splitMode ? splitSubtotal : orderSubtotal;
  const canConfirm =
    Boolean(paymentData?.paymentMethod) && (!splitMode || splitSubtotal > 0);

  const updateSplitQty = (menuItemId: string, nextQty: number) => {
    const item = currentOrder.items.find((entry) => entry.menu_item_id === menuItemId);
    if (!item) return;

    const boundedQty = Math.max(0, Math.min(item.quantity, nextQty));
    setSplitQuantities((prev) => ({
      ...prev,
      [menuItemId]: boundedQty,
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1 px-5">
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              {splitMode ? "Armar subcuenta" : "Detalle de la orden"}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSplitMode((prev) => !prev);
                setSplitQuantities({});
                setPaymentData(null);
              }}
              className="h-8 border-[var(--card-border)] text-xs text-gray-300"
            >
              {splitMode ? "Cuenta completa" : "Dividir cuenta"}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {currentOrder.items.map((it) => {
              const selectedQty = Number(splitQuantities[it.menu_item_id] || 0);

              return (
                <div
                  key={it.menu_item_id}
                  className="rounded-lg border border-[var(--card-border)] bg-background/20 p-3"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">
                        {it.menu_item_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {it.quantity} x {formatARS(it.unit_price)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatARS(it.subtotal)}
                    </div>
                  </div>

                  {splitMode && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateSplitQty(it.menu_item_id, selectedQty - 1)}
                          disabled={selectedQty <= 0}
                          className="size-8 border-[var(--card-border)] p-0"
                        >
                          -
                        </Button>
                        <span className="min-w-8 rounded-md bg-muted/30 px-2 py-1 text-center text-sm font-semibold text-white">
                          {selectedQty}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateSplitQty(it.menu_item_id, selectedQty + 1)}
                          disabled={selectedQty >= it.quantity}
                          className="size-8 border-[var(--card-border)] p-0"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-xs text-gray-500">Subcuenta</div>
                        <div className="font-semibold text-white">
                          {formatARS(selectedQty * it.unit_price)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {splitMode && (
            <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-primary/10 p-3">
              <div className="text-xs text-gray-400">Total seleccionado</div>
              <div className="text-2xl font-bold text-white">
                {formatARS(splitSubtotal)}
              </div>
            </div>
          )}
        </div>

        <PaymentSection subtotal={subtotal} onChange={handlePaymentChange} />
      </ScrollArea>

      <div className="flex gap-2 border-t border-[var(--card-border)] p-4 pb-8">
        <Button
          onClick={() =>
            onPrint(paymentData ?? undefined, splitMode ? splitItems : undefined)
          }
          disabled={splitMode && splitSubtotal <= 0}
          variant="outline"
          className="flex-1 rounded-lg border-[var(--card-border)] py-2 text-sm font-semibold text-gray-300"
        >
          Imprimir ticket
        </Button>
        <Button
          onClick={() =>
            paymentData?.paymentMethod &&
            onConfirm(paymentData as PaymentData, splitMode ? splitItems : undefined)
          }
          disabled={!canConfirm}
          className="flex-1 cursor-pointer rounded-lg bg-[var(--primary)] py-2 text-sm font-semibold"
        >
          {splitMode ? "Cobrar subcuenta" : "Confirmar pago"}
        </Button>
      </div>
    </div>
  );
}

export default CheckoutSheetContent;
