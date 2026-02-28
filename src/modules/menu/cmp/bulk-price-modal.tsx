import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { formatARS } from "@/modules/commons/utils/helpers";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Category {
  category_id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category_id?: string | number;
  category_name?: string;
  slug?: string;
}

interface BulkPriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  products: Product[];
  onSuccess: () => void;
}

type OperationType =
  | "pct_increase"
  | "pct_decrease"
  | "fixed_amount_increase"
  | "fixed_amount_decrease"
  | "fixed_price";

export default function BulkPriceModal({
  open,
  onOpenChange,
  categories,
  products,
  onSuccess,
}: BulkPriceModalProps) {
  const [step, setStep] = useState<"setup" | "preview">("setup");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [operation, setOperation] = useState<OperationType>("pct_increase");
  const [value, setValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening
  useMemo(() => {
    if (open) {
      setStep("setup");
      setIsSubmitting(false);
      // Optional: don't reset selections to persist user intent if they accidentally close?
      // For now let's keep previous selection or reset?
      // resetting for cleaner state
      // setSelectedCategories([]);
      // setOperation("pct_increase");
      // setValue(0);
    }
  }, [open]);

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map((c) => c.category_id.toString()));
    }
  };

  const previewData = useMemo(() => {
    if (step !== "preview") return [];

    const selectedCatsSet = new Set(selectedCategories.map((id) => String(id)));

    // Filter products belonging to selected categories
    const affectedProducts = products.filter((p) =>
      selectedCatsSet.has(String(p.category_id)),
    );

    return affectedProducts.map((p) => {
      let newPrice = p.price;
      const val = Number(value);

      switch (operation) {
        case "pct_increase":
          newPrice = p.price * (1 + val / 100);
          break;
        case "pct_decrease":
          newPrice = p.price * (1 - val / 100);
          break;
        case "fixed_amount_increase":
          newPrice = p.price + val;
          break;
        case "fixed_amount_decrease":
          newPrice = Math.max(0, p.price - val);
          break;
        case "fixed_price":
          newPrice = val;
          break;
      }

      // Round to nearest integer if needed, usually prices are integers or 2 decimals. 
      // Existing code used integers in some places, let's keep it generally consistent.
      // JS floating point math might need rounding.
      newPrice = Math.round(newPrice);

      return {
        ...p,
        newPrice,
      };
    });
  }, [step, products, selectedCategories, operation, value]);

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Selecciona al menos una categoría");
      return;
    }
    if (value < 0 && operation !== "fixed_amount_decrease") {
       // Allow negative interaction only if logic supports it, but simple UI usually assumes positive input for "decrease" operation
       // Actually fixed_amount_decrease usually takes a positive number "Decrease by 100".
       // The backend implementation: price - value. So value should be positive.
       toast.error("El valor debe ser positivo");
       return;
    }

    if (step === "setup") {
      setStep("preview");
    } else {
      // Confirm and Save
      setIsSubmitting(true);
      try {
        const response = await fetch(
          `${API_BASE}/menu-items/bulk-update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              categoryIds: selectedCategories,
              operation,
              value,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error al actualizar precios");
        }

        const result = await response.json();
        toast.success(
          `Precios actualizados correctamente. ${result.changes} productos modificados.`,
        );
        onSuccess();
        onOpenChange(false);
      } catch (error) {
        console.error("Error bulk updating:", error);
        toast.error("Error al actualizar precios");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getOperationLabel = (op: OperationType) => {
    switch (op) {
      case "pct_increase":
        return "Aumento Porcentual (%)";
      case "pct_decrease":
        return "Descuento Porcentual (%)";
      case "fixed_amount_increase":
        return "Aumento Fijo ($)";
      case "fixed_amount_decrease":
        return "Descuento Fijo ($)";
      case "fixed_price":
        return "Fijar Precio ($)";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Actualización Masiva de Precios
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === "setup"
              ? "Selecciona categorías y define la regla de precio a aplicar."
              : "Revisa los cambios antes de confirmar."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "setup" ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-white">
                    Categorías Afectadas
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllCategories}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80"
                  >
                    {selectedCategories.length === categories.length
                      ? "Deseleccionar todas"
                      : "Seleccionar todas"}
                  </Button>
                </div>
                <ScrollArea className="h-40 w-full rounded-md border border-[var(--card-border)] bg-[#181c1f] p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.category_id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`cat-${cat.category_id}`}
                          checked={selectedCategories.includes(
                            cat.category_id.toString(),
                          )}
                          onCheckedChange={() =>
                            handleToggleCategory(cat.category_id.toString())
                          }
                          className="border-gray-500 data-[state=checked]:bg-[var(--primary)]"
                        />
                        <label
                          htmlFor={`cat-${cat.category_id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                        >
                          {cat.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedCategories.length} categorías seleccionadas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Tipo de Operación</Label>
                  <Select
                    value={operation}
                    onValueChange={(val) => setOperation(val as OperationType)}
                  >
                    <SelectTrigger className="bg-[#181c1f] border-[var(--card-border)] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181c1f] border-[var(--card-border)] text-white">
                      <SelectItem value="pct_increase">
                        Aumento Porcentual (%)
                      </SelectItem>
                      <SelectItem value="pct_decrease">
                        Descuento Porcentual (%)
                      </SelectItem>
                      <SelectItem value="fixed_amount_increase">
                        Aumento Fijo ($)
                      </SelectItem>
                      <SelectItem value="fixed_amount_decrease">
                        Descuento Fijo ($)
                      </SelectItem>
                      <SelectItem value="fixed_price">
                        Fijar Precio ($)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Valor</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="bg-[#181c1f] border-[var(--card-border)] text-white placeholder:text-gray-400"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ej: 10 para 10% ó $10
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#181c1f] p-4 rounded-lg border border-[var(--card-border)] mb-4">
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Resumen de la regla:
                </p>
                <p className="text-lg font-bold text-white">
                  {getOperationLabel(operation)}: {value}{" "}
                  {operation.includes("pct") ? "%" : ""}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  En {selectedCategories.length} categorías seleccionadas.
                </p>
              </div>

              <div className="rounded-md border border-[var(--card-border)]">
                <div className="grid grid-cols-12 bg-[#181c1f] p-3 text-sm font-medium text-gray-400 border-b border-[var(--card-border)]">
                  <div className="col-span-6">Producto</div>
                  <div className="col-span-3 text-right">Actual</div>
                  <div className="col-span-3 text-right">Nuevo</div>
                </div>
                <ScrollArea className="h-[40vh]">
                  {previewData.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 p-3 text-sm border-b border-[var(--card-border)] last:border-0 hover:bg-white/5"
                    >
                      <div className="col-span-6 font-medium truncate pr-2">
                        {item.name}
                        <span className="block text-xs text-gray-500">
                          {item.category_name}
                        </span>
                      </div>
                      <div className="col-span-3 text-right text-gray-400">
                        {formatARS(item.price)}
                      </div>
                      <div className="col-span-3 text-right font-bold text-[var(--primary)]">
                        {formatARS(item.newPrice)}
                      </div>
                    </div>
                  ))}
                  {previewData.length === 0 && (
                     <div className="p-8 text-center text-gray-500">
                        No hay productos afectados por esta selección.
                     </div>
                  )}
                </ScrollArea>
              </div>
              <div className="text-right text-xs text-gray-400">
                 Total de productos afectados: <strong>{previewData.length}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[var(--card-border)]">
          {step === "preview" ? (
            <Button
              variant="ghost"
              onClick={() => setStep("setup")}
              className="text-gray-400 hover:text-white"
            >
              Atrás
            </Button>
          ) : (
            <div /> // Spacer
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[var(--card-border)] text-white hover:bg-[var(--card-border)]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              disabled={isSubmitting || (step === "setup" && selectedCategories.length === 0)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === "setup" ? "Vista Previa" : "Confirmar Cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
