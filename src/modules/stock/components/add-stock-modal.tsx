import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import type { StockItem } from "../index";

interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
  onConfirm: (quantity: number, notes?: string) => void;
}

function AddStockModal({
  open,
  onOpenChange,
  item,
  onConfirm,
}: AddStockModalProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (open) {
      setQuantity(0);
      setNotes("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(quantity, notes || undefined);
    }
  };

  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      kg: "kilogramos",
      gr: "gramos",
      l: "litros",
      ml: "mililitros",
      unidad: "unidades",
    };
    return labels[unit] || unit;
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Stock</DialogTitle>
          <DialogDescription>
            Agregar stock a: <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Stock Actual</Label>
            <div className="text-lg font-semibold">
              {item.stock_quantity.toLocaleString("es-AR")}{" "}
              {getUnitLabel(item.purchase_unit)}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Cantidad a agregar</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="text-right"
              />
              <span className="text-muted-foreground w-24">
                {getUnitLabel(item.purchase_unit)}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Nuevo Stock Total</Label>
            <div className="text-lg font-semibold text-green-600">
              {(item.stock_quantity + quantity).toLocaleString("es-AR")}{" "}
              {getUnitLabel(item.purchase_unit)}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Compra a proveedor X"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={quantity <= 0}>
            Agregar Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddStockModal;
