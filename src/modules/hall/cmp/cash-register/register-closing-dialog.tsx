import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BAKERY_PRODUCTS } from "../../types/cash-register";
import type { CashRegisterShift, ClosingPayload } from "../../types/cash-register";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: CashRegisterShift | null;
  onSubmit: (data: ClosingPayload) => Promise<void>;
  fetchBakeryStock: () => Promise<Record<string, number>>;
}

type Step = "input" | "summary";

interface SummaryData {
  cashEnd: number;
  bankEnd: number;
  stockEndActual: Record<string, number>;
  stockSystem: Record<string, number>;
  totalSales: number;
  orderCount: number;
}

const CASH_DIFF_THRESHOLD = 500;
const STOCK_DIFF_THRESHOLD = 3;

export default function RegisterClosingDialog({
  open,
  onOpenChange,
  register,
  onSubmit,
  fetchBakeryStock,
}: Props) {
  const [step, setStep] = useState<Step>("input");
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [stock, setStock] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const name of BAKERY_PRODUCTS) {
      initial[name] = "";
    }
    return initial;
  });
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleStockChange = (name: string, value: string) => {
    setStock((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    cash !== "" &&
    bank !== "" &&
    BAKERY_PRODUCTS.every((name) => stock[name] !== "");

  const handleGenerateSummary = async () => {
    if (!isValid || !register) return;
    setLoadingSummary(true);

    try {
      // Fetch current stock from backend (system-calculated)
      const currentStock = await fetchBakeryStock();

      // Calculate stock_system based on start - sold
      const stockSystem: Record<string, number> = {};
      for (const name of BAKERY_PRODUCTS) {
        stockSystem[name] = currentStock[name] ?? 0;
      }

      // Fetch sales data
      const res = await fetch("http://localhost:3001/api/cash-register/status");
      if (!res.ok) throw new Error("Error al obtener estado de caja");
      const statusData = await res.json();
      const registerData = statusData.register;

      const stockEndActual: Record<string, number> = {};
      for (const name of BAKERY_PRODUCTS) {
        stockEndActual[name] = Number(stock[name]) || 0;
      }

      setSummaryData({
        cashEnd: Number(cash) || 0,
        bankEnd: Number(bank) || 0,
        stockEndActual,
        stockSystem,
        totalSales: registerData?.total_sales ?? 0,
        orderCount: registerData?.order_count ?? 0,
      });

      setStep("summary");
    } catch (err) {
      console.error("Error generating summary:", err);
      toast.error("Error al generar el resumen");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!register || submitting) return;
    setSubmitting(true);

    try {
      const stockEndActual: Record<string, number> = {};
      for (const name of BAKERY_PRODUCTS) {
        stockEndActual[name] = Number(stock[name]) || 0;
      }

      await onSubmit({
        register_id: register.id,
        cash_end: Number(cash) || 0,
        bank_end: Number(bank) || 0,
        stock_end_actual: stockEndActual,
      });

      // Reset form
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("input");
    setCash("");
    setBank("");
    setStock(() => {
      const initial: Record<string, string> = {};
      for (const name of BAKERY_PRODUCTS) {
        initial[name] = "";
      }
      return initial;
    });
    setSummaryData(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  const shiftLabel = register?.shift === "morning" ? "Mañana" : "Tarde";

  const summaryText = useMemo(() => {
    if (!summaryData || !register) return "";

    const cashDiff = summaryData.cashEnd - register.cash_start;
    const bankDiff = summaryData.bankEnd - register.bank_start;

    const formatDiff = (n: number) => (n >= 0 ? `+$${n.toLocaleString()}` : `-$${Math.abs(n).toLocaleString()}`);

    let text = `CIERRE DE CAJA - ${register.date} - Turno ${shiftLabel}\n`;
    text += `================================\n`;
    text += `Abierta a las ${new Date(register.opened_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}\n\n`;
    text += `EFECTIVO: Inicio $${register.cash_start.toLocaleString()} | Cierre $${summaryData.cashEnd.toLocaleString()} | Dif ${formatDiff(cashDiff)}\n`;
    text += `BANCO/MP: Inicio $${register.bank_start.toLocaleString()} | Cierre $${summaryData.bankEnd.toLocaleString()} | Dif ${formatDiff(bankDiff)}\n`;
    text += `--------------------------------\n`;
    text += `STOCK PANADERIA:\n`;

    for (const name of BAKERY_PRODUCTS) {
      const start = register.stock_start[name] ?? 0;
      const system = summaryData.stockSystem[name] ?? 0;
      const actual = summaryData.stockEndActual[name] ?? 0;
      const diff = actual - system;
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
      text += `  ${name}: Inicio ${start} | Sistema ${system} | Real ${actual} | Dif ${diffStr}\n`;
    }

    text += `--------------------------------\n`;
    text += `Total Ventas: $${summaryData.totalSales.toLocaleString()}\n`;
    text += `Comandas: ${summaryData.orderCount}\n`;
    text += `================================`;

    return text;
  }, [summaryData, register, shiftLabel]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success("Resumen copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el resumen");
    }
  };

  if (!register) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Cierre de Caja</DialogTitle>
          <DialogDescription className="text-gray-400">
            Turno:{" "}
            <span className="text-[var(--info)] font-medium">
              {shiftLabel}
            </span>{" "}
            — {register.date} — Abierta a las{" "}
            {new Date(register.opened_at).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <>
            <div className="space-y-5 py-2">
              {/* Money inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Efectivo al cierre ($)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    className="bg-[#181c1f] border-[var(--card-border)] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Banco / MP al cierre ($)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="bg-[#181c1f] border-[var(--card-border)] text-white"
                  />
                </div>
              </div>

              {/* Bakery stock */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  Stock Real Final (conteo manual)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {BAKERY_PRODUCTS.map((name) => (
                    <div key={name} className="space-y-1">
                      <Label className="text-xs text-gray-400">{name}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={stock[name]}
                        onChange={(e) =>
                          handleStockChange(name, e.target.value)
                        }
                        className="bg-[#181c1f] border-[var(--card-border)] text-white h-9"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-[var(--card-border)] text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateSummary}
                disabled={!isValid || loadingSummary}
                className="bg-[var(--info)] hover:bg-[var(--info)]/80 text-white"
              >
                {loadingSummary ? "Calculando..." : "Generar Resumen"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "summary" && summaryData && (
          <>
            <div className="space-y-4 py-2">
              {/* Cash summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Caja</h4>
                <div className="bg-[#181c1f] rounded-lg p-3 space-y-1 text-sm">
                  <SummaryRow
                    label="Efectivo"
                    start={register.cash_start}
                    end={summaryData.cashEnd}
                    isMoney
                    threshold={CASH_DIFF_THRESHOLD}
                  />
                  <SummaryRow
                    label="Banco/MP"
                    start={register.bank_start}
                    end={summaryData.bankEnd}
                    isMoney
                    threshold={CASH_DIFF_THRESHOLD}
                  />
                </div>
              </div>

              {/* Stock summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">
                  Stock Panadería
                </h4>
                <div className="bg-[#181c1f] rounded-lg p-3">
                  <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 mb-2 font-medium">
                    <span className="col-span-1">Producto</span>
                    <span className="text-center">Inicio</span>
                    <span className="text-center">Sistema</span>
                    <span className="text-center">Real</span>
                    <span className="text-center">Dif</span>
                  </div>
                  {BAKERY_PRODUCTS.map((name) => {
                    const start = register.stock_start[name] ?? 0;
                    const system = summaryData.stockSystem[name] ?? 0;
                    const actual = summaryData.stockEndActual[name] ?? 0;
                    const diff = actual - system;
                    const isWarning =
                      Math.abs(diff) > STOCK_DIFF_THRESHOLD;

                    return (
                      <div
                        key={name}
                        className="grid grid-cols-5 gap-2 text-sm py-1 border-b border-gray-800 last:border-0"
                      >
                        <span className="col-span-1 text-gray-300 text-xs truncate">
                          {name}
                        </span>
                        <span className="text-center text-gray-400">
                          {start}
                        </span>
                        <span className="text-center text-gray-400">
                          {system}
                        </span>
                        <span className="text-center text-white">
                          {actual}
                        </span>
                        <span
                          className={`text-center font-medium ${
                            isWarning
                              ? "text-red-400"
                              : diff !== 0
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {diff >= 0 ? `+${diff}` : diff}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-[#181c1f] rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total ventas</span>
                  <span className="text-white font-semibold">
                    ${summaryData.totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comandas</span>
                  <span className="text-white font-semibold">
                    {summaryData.orderCount}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="border-[var(--card-border)] text-gray-300"
              >
                Volver
              </Button>
              <Button
                variant="outline"
                onClick={handleCopySummary}
                className="border-[var(--card-border)] text-gray-300"
              >
                Copiar resumen
              </Button>
              <Button
                onClick={handleConfirmClose}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? "Cerrando..." : "Cerrar Caja"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  start,
  end,
  isMoney,
  threshold,
}: {
  label: string;
  start: number;
  end: number;
  isMoney?: boolean;
  threshold: number;
}) {
  const diff = end - start;
  const isWarning = Math.abs(diff) > threshold;
  const prefix = isMoney ? "$" : "";
  const diffStr =
    diff >= 0
      ? `+${prefix}${Math.abs(diff).toLocaleString()}`
      : `-${prefix}${Math.abs(diff).toLocaleString()}`;

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <div className="flex gap-4 items-center text-xs">
        <span className="text-gray-500">
          Inicio: {prefix}
          {start.toLocaleString()}
        </span>
        <span className="text-gray-500">
          Cierre: {prefix}
          {end.toLocaleString()}
        </span>
        <span
          className={`font-medium ${
            isWarning
              ? "text-red-400"
              : diff !== 0
                ? "text-yellow-400"
                : "text-green-400"
          }`}
        >
          {diffStr}
        </span>
      </div>
    </div>
  );
}
