import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

// interface selectedProduct {
//   id: string;
//   name: string;
//   price: number;
//   qty: number;
//   // options?: string[];
// }
// interface Props {
//   selectedProducts: selectedProduct[];
//   onUpdateProductQty: (productId: string, qty: number) => void;
//   onPay: () => void;
//   onCommand: () => void;
//   isReadyToPay: boolean;
//   onRemoveProduct?: (productId: string) => void;
//   onClearProducts?: () => void;
//   onChangeSeat?: () => void;
// }

export default function PaymentSection({
  subtotal,
}: {
  subtotal: number;
  isReadyToPay: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "qr" | "card"
  >("cash");
  const [cashPaid, setCashPaid] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const computedDiscount = useMemo(() => {
    if (discountType === "percent") {
      return Math.round((subtotal * (discountValue || 0)) / 100);
    }
    return discountValue || 0;
  }, [discountType, discountValue, subtotal]);

  const totalAfterDiscount = Math.max(0, subtotal - appliedDiscount);
  const change =
    paymentMethod === "cash" && cashPaid !== ""
      ? Math.max(0, Number(cashPaid) - totalAfterDiscount)
      : 0;

  return (
    <div className="mt-6">
      <div className="rounded-lg border border-[var(--card-border)] p-4 bg-[var(--background-section)]">
        <div className="mb-3 text-sm font-semibold text-gray-300">Pago</div>

        {/* Payment method */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${paymentMethod === "cash"
              ? "border-[hsl(var(--primary))] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
              }`}
          >
            <input
              type="radio"
              name="payment"
              className="hidden"
              checked={paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")}
            />
            <span className="text-base">💵</span>
            <span className="text-sm">Efectivo</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${paymentMethod === "transfer"
              ? "border-[hsl(var(--primary))] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
              }`}
          >
            <input
              type="radio"
              name="payment"
              className="hidden"
              checked={paymentMethod === "transfer"}
              onChange={() => setPaymentMethod("transfer")}
            />
            <span className="text-base">🔁</span>
            <span className="text-sm">Transferencia</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${paymentMethod === "qr"
              ? "border-[hsl(var(--primary))] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
              }`}
          >
            <input
              type="radio"
              name="payment"
              className="hidden"
              checked={paymentMethod === "qr"}
              onChange={() => setPaymentMethod("qr")}
            />
            <span className="text-base">📱</span>
            <span className="text-sm">QR</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${paymentMethod === "card"
              ? "border-[hsl(var(--primary))] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
              }`}
          >
            <input
              type="radio"
              name="payment"
              className="hidden"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            <span className="text-base">💳</span>
            <span className="text-sm">Débito / Crédito</span>
          </label>
        </div>

        {/* Cash input */}
        {paymentMethod === "cash" && (
          <div className="mb-3">
            <label className="text-xs text-gray-400">Monto recibido</label>
            <input
              type="number"
              min={0}
              step={100}
              value={cashPaid === "" ? "" : cashPaid}
              onChange={(e) =>
                setCashPaid(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[#18181b] border border-[var(--card-border)] text-white"
              placeholder="0"
            />
            <div className="text-sm mt-2 text-gray-400">
              Cambio a devolver:{" "}
              <span className="font-semibold text-white">
                ${change.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Discount inputs */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-gray-400">Descuento</div>
            <div className="ml-auto text-xs text-gray-400">
              Aplicado:{" "}
              <span className="font-semibold text-white">
                ${appliedDiscount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(
                  e.target.value === "percent" ? "percent" : "fixed"
                )
              }
              className="px-3 py-2 rounded-lg bg-[#18181b] border border-[var(--card-border)] text-white text-sm"
            >
              <option value="percent">%</option>
              <option value="fixed">$</option>
            </select>

            <input
              type="number"
              min={0}
              step={discountType === "percent" ? 1 : 100}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value || 0))}
              className="flex-1 px-3 py-2 rounded-lg bg-[#18181b] border border-[var(--card-border)] text-white text-sm"
              placeholder={discountType === "percent" ? "0%" : "$0"}
            />

            <Button
              type="button"
              onClick={() => setAppliedDiscount(computedDiscount)}
              className="px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-black font-semibold"
            >
              Aplicar
            </Button>

            <Button
              type="button"
              onClick={() => {
                setAppliedDiscount(0);
                setDiscountValue(0);
              }}
              className="px-3 py-2 rounded-lg border border-[var(--card-border)] text-sm text-gray-300"
            >
              Limpiar
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Calculado:{" "}
            <span className="text-white font-medium">
              ${computedDiscount.toLocaleString()}
            </span>
            {" • "}
            Total con descuento:{" "}
            <span className="text-white font-semibold">
              ${Math.max(0, subtotal - computedDiscount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* small note when ready */}
        <div className="text-xs text-gray-500">
          Método seleccionado:{" "}
          <span className="text-white font-medium">{paymentMethod}</span>
        </div>
      </div>
    </div>
  );
}
