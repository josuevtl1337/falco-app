import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Pencil, Trash2, Calculator, Search } from "lucide-react";
import { ICostProduct, IRecipe, ISupplier, IRawMaterial, FixedCostType } from "../types";
import { toast } from "sonner";
import { SearchAndFilter } from "./search-and-filter";

const API_BASE = "http://localhost:3001/api/cost-engine";

function ProductsTab() {
  const [products, setProducts] = useState<ICostProduct[]>([]);
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<IRawMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ICostProduct | null>(null);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    recipe_id: "",
    fixed_cost: "",
    fixed_cost_type: "per_item" as FixedCostType,
    preparation_time_minutes: "",
    margin_percentage: "50",
  });

  useEffect(() => {
    fetchProducts();
    fetchRecipes();
    fetchSuppliers();
    fetchRawMaterials();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE}/suppliers`);
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores");
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE}/raw-materials`);
      const data = await response.json();
      setRawMaterials(data);
    } catch (error) {
      toast.error("Error al cargar materias primas");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${API_BASE}/recipes`);
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      toast.error("Error al cargar recetas");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `${API_BASE}/products/${editingProduct.id}`
        : `${API_BASE}/products`;
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          recipe_id: formData.recipe_id && formData.recipe_id !== "none" ? parseInt(formData.recipe_id) : null,
          fixed_cost: parseFloat(formData.fixed_cost) || 0,
          fixed_cost_type: formData.fixed_cost_type,
          preparation_time_minutes:
            parseFloat(formData.preparation_time_minutes) || 0,
          margin_percentage: parseFloat(formData.margin_percentage),
        }),
      });

      if (response.ok) {
        toast.success(
          editingProduct ? "Producto actualizado" : "Producto creado"
        );
        setIsDialogOpen(false);
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
        fetchProducts();
      } else {
        toast.error("Error al guardar producto");
      }
    } catch (error) {
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
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Producto eliminado");
        fetchProducts();
      } else {
        toast.error("Error al eliminar producto");
      }
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  const handleRecalculate = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}/recalculate`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Precio recalculado");
        fetchProducts();
      } else {
        toast.error("Error al recalcular precio");
      }
    } catch (error) {
      toast.error("Error al recalcular precio");
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setRecipeSearchTerm("");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Productos de Carta</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
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
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Modifica la información del producto"
                  : "Crea un nuevo producto de carta con receta y márgenes"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="recipe_id">Receta</Label>
                <Select
                  value={formData.recipe_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, recipe_id: value });
                    setRecipeSearchTerm("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una receta" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar receta..."
                          value={recipeSearchTerm}
                          onChange={(e) => setRecipeSearchTerm(e.target.value)}
                          className="pl-8 h-8"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <SelectItem value="none">Sin receta</SelectItem>
                    {recipes
                      .filter((recipe) =>
                        recipe.name
                          .toLowerCase()
                          .includes(recipeSearchTerm.toLowerCase())
                      )
                      .map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id.toString()}>
                          {recipe.name}
                        </SelectItem>
                      ))}
                    {recipes.filter((recipe) =>
                      recipe.name
                        .toLowerCase()
                        .includes(recipeSearchTerm.toLowerCase())
                    ).length === 0 && recipeSearchTerm && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        No se encontraron recetas
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fixed_cost">Gasto Fijo</Label>
                <Input
                  id="fixed_cost"
                  type="number"
                  step="0.01"
                  value={formData.fixed_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, fixed_cost: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="fixed_cost_type">Tipo de Gasto Fijo</Label>
                <Select
                  value={formData.fixed_cost_type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      fixed_cost_type: value as FixedCostType,
                    })
                  }
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
              <div>
                <Label htmlFor="preparation_time_minutes">
                  Tiempo de Preparación (minutos)
                </Label>
                <Input
                  id="preparation_time_minutes"
                  type="number"
                  step="0.1"
                  value={formData.preparation_time_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preparation_time_minutes: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="margin_percentage">
                  Margen de Ganancia (%)
                </Label>
                <Input
                  id="margin_percentage"
                  type="number"
                  step="0.1"
                  value={formData.margin_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      margin_percentage: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Receta</TableHead>
            <TableHead>Costo Total</TableHead>
            <TableHead>Precio Sugerido</TableHead>
            <TableHead>Precio Carta</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const filtered = products.filter((product) => {
              const matchesSearch = product.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
              
              if (filterSupplier === "all") {
                return matchesSearch;
              }

              // Filtrar por proveedor: verificar si la receta del producto usa materias primas del proveedor
              if (!product.recipe_id) {
                return matchesSearch;
              }

              const recipe = recipes.find((r) => r.id === product.recipe_id);
              if (!recipe || !recipe.ingredients) {
                return matchesSearch;
              }

              const hasSupplierMaterial = recipe.ingredients.some((ingredient) => {
                const material = rawMaterials.find(
                  (m) => m.id === ingredient.raw_material_id
                );
                return material?.supplier_id !== null && 
                       material?.supplier_id !== undefined &&
                       material.supplier_id.toString() === filterSupplier;
              });

              return matchesSearch && hasSupplierMaterial;
            });

            if (filtered.length === 0) {
              return (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              );
            }

            return filtered.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.recipe_name || "-"}</TableCell>
              <TableCell>${product.calculated_cost.toFixed(2)}</TableCell>
              <TableCell>${product.suggested_price.toFixed(2)}</TableCell>
              <TableCell className="font-semibold">
                ${product.rounded_price.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRecalculate(product.id)}
                    title="Recalcular precio"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            ));
          })()}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProductsTab;
