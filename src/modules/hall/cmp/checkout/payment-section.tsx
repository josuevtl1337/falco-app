import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";

// export type PaymentMethod = {"cash" | "transfer" | "qr" | "card"};

export interface IPaymentMethod {
  id: string;
  name: string;
  code: string;
  active: number;
  created_at: string;
}

export interface PaymentData {
  paymentMethod: IPaymentMethod;
  discount_percentage: number;
  total_amount: number;
}

export function PaymentSection({
  subtotal,
  onChange,
}: {
  subtotal: number;
  onChange?: (data: PaymentData) => void;
}) {
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[] | []>(
    []
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<IPaymentMethod | null>(null);
  const [cashPaid, setCashPaid] = useState<number | null>(null);
  const [showDiscount, setshowDiscount] = useState<boolean>(false);

  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const computedDiscount = useMemo(() => {
    return Math.round((subtotal * (discountValue || 0)) / 100);
  }, [discountValue, subtotal]);

  const totalAfterDiscount = Math.max(0, subtotal - appliedDiscount);

  // change now puede ser negativo (falta) o positivo (vuelto)
  const change =
    selectedPaymentMethod?.code === "cash"
      ? Number(cashPaid || 0) - totalAfterDiscount
      : 0;

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/payment-methods");
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods");
      }
      const data = await response.json();

      setPaymentMethods(data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    onChange &&
      selectedPaymentMethod &&
      onChange({
        paymentMethod: selectedPaymentMethod,
        discount_percentage: discountValue,
        total_amount: totalAfterDiscount,
      });
  }, [selectedPaymentMethod, discountValue, totalAfterDiscount]);

  console.log(selectedPaymentMethod, totalAfterDiscount, discountValue);
  const onSelectPM = (name: string) => {
    setSelectedPaymentMethod(paymentMethods.find((pm) => pm.code === name)!);
    if (name !== "cash") setCashPaid(0);
  };

  return (
    <div className="rounded-lg border border-[var(--card-border)] p-4 bg-[var(--card-background)]">
      <div className="mb-3 text-sm font-semibold text-gray-300">Pago</div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <label
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${
            selectedPaymentMethod?.code === "cash"
              ? "border-[var(--primary)] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="payment"
            className="hidden"
            checked={selectedPaymentMethod?.code === "cash"}
            onChange={() => onSelectPM("cash")}
          />
          <span className="text-base">💵</span>
          <span className="text-sm">Efectivo</span>
        </label>

        <label
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${
            selectedPaymentMethod?.code === "transfer"
              ? "border-[var(--primary)] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="payment"
            className="hidden"
            checked={selectedPaymentMethod?.code === "transfer"}
            onChange={() => onSelectPM("transfer")}
          />
          <span className="text-base">🔁</span>
          <span className="text-sm">Transferencia</span>
        </label>

        <label
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${
            selectedPaymentMethod?.code === "qr_code"
              ? "border-[var(--primary)] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="payment"
            className="hidden"
            checked={selectedPaymentMethod?.code === "qr_code"}
            onChange={() => onSelectPM("qr_code")}
          />
          <span className="text-base">📱</span>
          <span className="text-sm">QR</span>
        </label>

        <label
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border ${
            selectedPaymentMethod?.code === "card"
              ? "border-[var(--primary)] bg-[rgba(116,189,94,0.06)]"
              : "border-[var(--card-border)] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="payment"
            className="hidden"
            checked={selectedPaymentMethod?.code === "card"}
            onChange={() => onSelectPM("card")}
          />
          <span className="text-base">💳</span>
          <span className="text-sm">Débito / Crédito</span>
        </label>
      </div>

      {/* Sección de efectivo: monto entregado por el cliente y vuelto/falta */}
      {selectedPaymentMethod?.code === "cash" && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2">Calcular vuelto</div>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              step={1}
              value={cashPaid ?? 0}
              onChange={(e) => setCashPaid(Number(e.target.value || 0))}
              className="flex-1 px-3 py-2 rounded-lg bg-[#18181b] border border-[var(--card-border)] text-white text-sm"
              placeholder={"Monto entregado por el cliente"}
            />

            <div className="text-sm text-gray-300">
              {change >= 0 ? (
                <div className="text-right">
                  <div className="text-xs text-slate-400">Vuelto</div>
                  <div className="font-semibold text-white">
                    ${Math.abs(change).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-xs text-amber-300">Faltan</div>
                  <div className="font-semibold text-red-500">
                    ${Math.abs(change).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDiscount ? (
        <>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value || 0))}
              className="flex-1 px-3 py-2 rounded-lg bg-[#18181b] border border-[var(--card-border)] text-white text-sm"
              placeholder={"0%"}
            />

            <Button
              type="button"
              onClick={() => setAppliedDiscount(computedDiscount)}
              className="cursor-pointer px-3 py-2 rounded-lg border-1 font-semibold"
            >
              Aplicar
            </Button>

            <Button
              type="button"
              variant={"outline"}
              onClick={() => {
                setAppliedDiscount(0);
                setDiscountValue(0);
                setshowDiscount(false);
              }}
              className="cursor-pointer px-3 py-2"
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
        </>
      ) : (
        <div
          className="text-xs text-[var(--info)] font-bold mt-1"
          onClick={() => setshowDiscount(true)}
        >
          <span className="text-md  cursor-pointer ">
            {" • "} Aplicar descuento
          </span>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--card-border)] pt-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <div>
            Método seleccionado:
            <span className="ml-2 text-white font-medium">
              {selectedPaymentMethod?.name}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Subtotal</span>
            <span className="text-white">${subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Descuento</span>
            <span className="text-white">
              -${computedDiscount.toLocaleString()}
            </span>
          </div>

          <div className="pt-3 border-t border-[var(--card-border)] flex justify-between items-baseline">
            <div className="text-lg font-medium text-gray-300">Total</div>
            <div className="text-2xl font-bold text-white">
              ${totalAfterDiscount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSection;
