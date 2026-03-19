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
  IconSearch,
  IconTag,
  IconCalculator,
  IconArrowRight,
} from "@tabler/icons-react";
import { ICostProduct, IRecipe, FixedCostType } from "../types";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/cost-engine";

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ProductsTab() {
  const [products, setProducts] = useState<ICostProduct[]>([]);
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ICostProduct | null>(null);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    recipe_id: "none",
    fixed_cost: "",
    fixed_cost_type: "per_item" as FixedCostType,
    preparation_time_minutes: "",
    margin_percentage: "50",
  });

  useEffect(() => {
    fetchProducts();
    fetchRecipes();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      setProducts(await response.json());
    } catch {
      toast.error("Error al cargar productos");
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${API_BASE}/recipes`);
      setRecipes(await response.json());
    } catch {
      toast.error("Error al cargar recetas");
    }
  };

  function resetForm() {
    setEditingProduct(null);
    setFormData({
      name: "",
      recipe_id: "none",
      fixed_cost: "",
      fixed_cost_type: "per_item",
      preparation_time_minutes: "",
      margin_percentage: "50",
    });
    setRecipeSearchTerm("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          recipe_id: formData.recipe_id && formData.recipe_id !== "none" ? parseInt(formData.recipe_id) : null,
          fixed_cost: parseFloat(formData.fixed_cost) || 0,
          fixed_cost_type: formData.fixed_cost_type,
          preparation_time_minutes: parseFloat(formData.preparation_time_minutes) || 0,
          margin_percentage: parseFloat(formData.margin_percentage),
        }),
      });
      if (response.ok) {
        toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
      } else {
        toast.error("Error al guardar producto");
      }
    } catch {
      toast.error("Error al guardar producto");
    }
  };

  const handleEdit = (product: ICostProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      recipe_id: product.recipe_id?.toString() || "none",
      fixed_cost: product.fixed_cost.toString(),
      fixed_cost_type: product.fixed_cost_type,
      preparation_time_minutes: product.preparation_time_minutes.toString(),
      margin_percentage: product.margin_percentage.toString(),
    });
    setRecipeSearchTerm("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Producto eliminado");
        fetchProducts();
      } else {
        toast.error("Error al eliminar producto");
      }
    } catch {
      toast.error("Error al eliminar producto");
    }
  };

  const handleRecalculate = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}/recalculate`, { method: "POST" });
      if (response.ok) {
        toast.success("Precio recalculado");
        fetchProducts();
      } else {
        toast.error("Error al recalcular");
      }
    } catch {
      toast.error("Error al recalcular");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="gap-1.5"
        >
          <IconPlus size={16} />
          Agregar Producto
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <IconTag size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron productos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className="border-border/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="pt-4 pb-3 px-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    {product.recipe_name && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mt-1">
                        {product.recipe_name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-amber-400">
                      ${formatARS(product.rounded_price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">precio carta</p>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Costo total</span>
                    <span>${formatARS(product.calculated_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Margen</span>
                    <span className="text-emerald-400">{product.margin_percentage}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/30">
                    <span>${formatARS(product.calculated_cost)}</span>
                    <IconArrowRight size={10} />
                    <span className="font-medium text-foreground">${formatARS(product.rounded_price)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleRecalculate(product.id)}
                    title="Recalcular precio"
                  >
                    <IconCalculator size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(product)}
                  >
                    <IconPencil size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(product.id)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setRecipeSearchTerm(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica el producto y sus márgenes" : "Crea un producto de carta con receta y márgenes"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prod_name">Nombre *</Label>
              <Input
                id="prod_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Receta</Label>
              <Select
                value={formData.recipe_id}
                onValueChange={(value) => { setFormData({ ...formData, recipe_id: value }); setRecipeSearchTerm(""); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una receta" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 border-b">
                    <div className="relative">
                      <IconSearch size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar receta..."
                        value={recipeSearchTerm}
                        onChange={(e) => setRecipeSearchTerm(e.target.value)}
                        className="pl-7 h-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <SelectItem value="none">Sin receta</SelectItem>
                  {filteredRecipes.map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id.toString()}>
                      {recipe.name} — ${formatARS(recipe.recipe_cost)}
                    </SelectItem>
                  ))}
                  {filteredRecipes.length === 0 && recipeSearchTerm && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                      No se encontraron recetas
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fixed_cost">Gasto Fijo</Label>
                <Input
                  id="fixed_cost"
                  type="number"
                  step="0.01"
                  value={formData.fixed_cost}
                  onChange={(e) => setFormData({ ...formData, fixed_cost: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo Gasto Fijo</Label>
                <Select
                  value={formData.fixed_cost_type}
                  onValueChange={(value) => setFormData({ ...formData, fixed_cost_type: value as FixedCostType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_item">Por ítem</SelectItem>
                    <SelectItem value="per_minute">Por minuto</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prep_time">Tiempo Preparación (min)</Label>
                <Input
                  id="prep_time"
                  type="number"
                  step="0.1"
                  value={formData.preparation_time_minutes}
                  onChange={(e) => setFormData({ ...formData, preparation_time_minutes: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="margin">Margen (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  step="0.1"
                  value={formData.margin_percentage}
                  onChange={(e) => setFormData({ ...formData, margin_percentage: e.target.value })}
                  required
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

export default ProductsTab;
