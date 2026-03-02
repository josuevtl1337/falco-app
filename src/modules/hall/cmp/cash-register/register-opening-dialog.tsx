import { useState } from "react";
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
import type { OpeningPayload } from "../../types/cash-register";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: string;
  onSubmit: (data: OpeningPayload) => Promise<void>;
}

export default function RegisterOpeningDialog({
  open,
  onOpenChange,
  shift,
  onSubmit,
}: Props) {
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [stock, setStock] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const name of BAKERY_PRODUCTS) {
      initial[name] = "";
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);

  const handleStockChange = (name: string, value: string) => {
    setStock((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    cash !== "" &&
    bank !== "" &&
    BAKERY_PRODUCTS.every((name) => stock[name] !== "");

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      const stockStart: Record<string, number> = {};
      for (const name of BAKERY_PRODUCTS) {
        stockStart[name] = Number(stock[name]) || 0;
      }

      await onSubmit({
        shift,
        cash_start: Number(cash) || 0,
        bank_start: Number(bank) || 0,
        stock_start: stockStart,
      });

      // Reset form
      setCash("");
      setBank("");
      setStock(() => {
        const initial: Record<string, string> = {};
        for (const name of BAKERY_PRODUCTS) {
          initial[name] = "";
        }
        return initial;
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Apertura de Caja</DialogTitle>
          <DialogDescription className="text-gray-400">
            Turno:{" "}
            <span className="text-[var(--info)] font-medium">
              {shift === "morning" ? "Mañana" : "Tarde"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Money inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Efectivo en caja ($)</Label>
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
              <Label className="text-gray-300">Banco / MP ($)</Label>
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
              Stock Inicial de Panadería
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
                    onChange={(e) => handleStockChange(name, e.target.value)}
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
            onClick={() => onOpenChange(false)}
            className="border-[var(--card-border)] text-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? "Abriendo..." : "Abrir Caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
