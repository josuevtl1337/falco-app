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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CreateStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateStockModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateStockModalProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [minStock, setMinStock] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setUnit("kg");
      setMinStock(0);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name) {
        toast.error("El nombre es requerido");
        return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, purchase_unit: unit, min_stock: minStock }),
      });

      if (!response.ok) throw new Error("Error creating stock item");

      toast.success("Insumo creado correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating stock item:", error);
      toast.error("Error al crear el insumo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Insumo</DialogTitle>
          <DialogDescription>
            Agrega un nuevo insumo al sistema para controlar su stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Insumo</Label>
            <Input
              id="name"
              placeholder="Ej: Harina 0000"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad de Compra</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                  <SelectItem value="gr">Gramo (gr)</SelectItem>
                  <SelectItem value="l">Litro (l)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="unidad">Unidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="min-stock">Stock Mínimo</Label>
              <Input
                id="min-stock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear Insumo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
