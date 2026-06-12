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
import type { OpeningPayload, VitrineStockItem } from "../../types/cash-register";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: string;
  onSubmit: (data: OpeningPayload) => Promise<void>;
  vitrineStockItems: VitrineStockItem[];
}

export default function RegisterOpeningDialog({
  open,
  onOpenChange,
  shift,
  onSubmit,
  vitrineStockItems,
}: Props) {
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [stock, setStock] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleStockChange = (name: string, value: string) => {
    setStock((prev) => ({ ...prev, [name]: value }));
  };

  const openingItems = vitrineStockItems.filter(
    (item) => item.active && item.show_on_open,
  );

  const isValid =
    cash !== "" &&
    bank !== "" &&
    openingItems.every((item) => stock[String(item.id)] !== "");

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      const stockStart: Record<string, number> = {};
      for (const item of openingItems) {
        stockStart[String(item.id)] = Number(stock[String(item.id)]) || 0;
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
      setStock({});
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
              Stock Inicial de Vitrina
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {openingItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  <Label className="text-xs text-gray-400">{item.label}</Label>
                  <Input
                    type="number"
                    min="0"
                    step={item.unit_step}
                    placeholder="0"
                    value={stock[String(item.id)] ?? ""}
                    onChange={(e) =>
                      handleStockChange(String(item.id), e.target.value)
                    }
                    className="bg-[#181c1f] border-[var(--card-border)] text-white h-9"
                  />
                  {item.unit_step !== 1 && (
                    <p className="text-[11px] text-gray-500">
                      Permite fracciones de {item.unit_step}
                    </p>
                  )}
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
