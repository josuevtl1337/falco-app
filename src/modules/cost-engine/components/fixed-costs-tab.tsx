import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconReceipt,
  IconWorld,
  IconTag,
  IconSearch,
} from "@tabler/icons-react";
import { IFixedCost, ICostProduct } from "../types";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/cost-engine";

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FixedCostsTab() {
  const [fixedCosts, setFixedCosts] = useState<IFixedCost[]>([]);
  const [products, setProducts] = useState<ICostProduct[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<IFixedCost | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost_per_item: "",
    cost_per_minute: "",
    is_global: false,
    product_id: "",
  });

  useEffect(() => {
    fetchFixedCosts();
    fetchProducts();
  }, []);

  const fetchFixedCosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/fixed-costs`);
      setFixedCosts(await response.json());
    } catch {
      toast.error("Error al cargar gastos fijos");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      setProducts(await response.json());
    } catch {
      toast.error("Error al cargar productos");
    }
  };

  function resetForm() {
    setEditingFixedCost(null);
    setFormData({ name: "", description: "", cost_per_item: "", cost_per_minute: "", is_global: false, product_id: "" });
    setProductSearch("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFixedCost ? `${API_BASE}/fixed-costs/${editingFixedCost.id}` : `${API_BASE}/fixed-costs`;
      const response = await fetch(url, {
        method: editingFixedCost ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          cost_per_item: parseFloat(formData.cost_per_item) || 0,
          cost_per_minute: parseFloat(formData.cost_per_minute) || 0,
          is_global: formData.is_global ? 1 : 0,
          product_id: formData.is_global ? null : formData.product_id ? parseInt(formData.product_id) : null,
        }),
      });
      if (response.ok) {
        toast.success(editingFixedCost ? "Gasto fijo actualizado" : "Gasto fijo creado");
        setIsDialogOpen(false);
        resetForm();
        fetchFixedCosts();
      } else {
        toast.error("Error al guardar gasto fijo");
      }
    } catch {
      toast.error("Error al guardar gasto fijo");
    }
  };

  const handleEdit = (fixedCost: IFixedCost) => {
    setEditingFixedCost(fixedCost);
    setFormData({
      name: fixedCost.name,
      description: fixedCost.description || "",
      cost_per_item: fixedCost.cost_per_item.toString(),
      cost_per_minute: fixedCost.cost_per_minute.toString(),
      is_global: fixedCost.is_global === 1,
      product_id: fixedCost.product_id?.toString() || "",
    });
    setProductSearch("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto fijo?")) return;
    try {
      const response = await fetch(`${API_BASE}/fixed-costs/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Gasto fijo eliminado");
        fetchFixedCosts();
      } else {
        toast.error("Error al eliminar gasto fijo");
      }
    } catch {
      toast.error("Error al eliminar gasto fijo");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="gap-1.5"
        >
          <IconPlus size={16} />
          Agregar Gasto Fijo
        </Button>
      </div>

      {fixedCosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <IconReceipt size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay gastos fijos configurados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {fixedCosts.map((fc) => (
            <Card
              key={fc.id}
              className="border-border/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="pt-4 pb-3 px-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                      fc.is_global
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "bg-amber-500/10 border border-amber-500/20"
                    }`}>
                      {fc.is_global
                        ? <IconWorld size={18} className="text-blue-400" />
                        : <IconTag size={18} className="text-amber-400" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{fc.name}</h3>
                      <Badge
                        className={`text-[10px] mt-0.5 ${
                          fc.is_global
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {fc.is_global ? "Global" : fc.product_name || "Por producto"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {fc.description && (
                  <p className="text-xs text-muted-foreground truncate">{fc.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Por ítem</p>
                    <p className="text-sm font-semibold">${formatARS(fc.cost_per_item)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Por minuto</p>
                    <p className="text-sm font-semibold">${formatARS(fc.cost_per_minute)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(fc)}
                  >
                    <IconPencil size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(fc.id)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFixedCost ? "Editar Gasto Fijo" : "Nuevo Gasto Fijo"}</DialogTitle>
            <DialogDescription>
              {editingFixedCost ? "Modifica el gasto fijo" : "Define un gasto fijo global o por producto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fc_name">Nombre *</Label>
              <Input
                id="fc_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fc_description">Descripción</Label>
              <Textarea
                id="fc_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_global}
                onCheckedChange={(checked) => setFormData({ ...formData, is_global: checked })}
              />
              <Label>Gasto fijo global</Label>
            </div>
            {!formData.is_global && (
              <div>
                <Label>Producto</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => { setFormData({ ...formData, product_id: value }); setProductSearch(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 border-b">
                      <div className="relative">
                        <IconSearch size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar producto..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-7 h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                    {filteredProducts.length === 0 && productSearch && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        No se encontraron productos
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost_per_item">Costo por Ítem</Label>
                <Input
                  id="cost_per_item"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_item}
                  onChange={(e) => setFormData({ ...formData, cost_per_item: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cost_per_minute">Costo por Minuto</Label>
                <Input
                  id="cost_per_minute"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_minute}
                  onChange={(e) => setFormData({ ...formData, cost_per_minute: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FixedCostsTab;
