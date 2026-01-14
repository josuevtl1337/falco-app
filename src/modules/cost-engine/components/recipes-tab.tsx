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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Calculator } from "lucide-react";
import { IRecipe, IRawMaterial, ISupplier, UnitType } from "../types";
import { toast } from "sonner";
import { SearchAndFilter } from "./search-and-filter";

const API_BASE = "http://localhost:3001/api/cost-engine";

function RecipesTab() {
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<IRawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<IRecipe | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ingredients: [] as Array<{
      raw_material_id: string;
      quantity: string;
      unit: UnitType;
    }>,
  });
  const [currentIngredient, setCurrentIngredient] = useState({
    raw_material_id: "",
    quantity: "",
    unit: "gr" as UnitType,
  });

  useEffect(() => {
    fetchRecipes();
    fetchRawMaterials();
    fetchSuppliers();
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

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${API_BASE}/recipes`);
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      toast.error("Error al cargar recetas");
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

  const addIngredient = () => {
    if (!currentIngredient.raw_material_id || !currentIngredient.quantity) {
      toast.error("Completa todos los campos del ingrediente");
      return;
    }

    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        {
          raw_material_id: currentIngredient.raw_material_id,
          quantity: currentIngredient.quantity,
          unit: currentIngredient.unit,
        },
      ],
    });

    setCurrentIngredient({
      raw_material_id: "",
      quantity: "",
      unit: "gr",
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ingredients.length === 0) {
      toast.error("Agrega al menos un ingrediente");
      return;
    }

    try {
      const url = editingRecipe
        ? `${API_BASE}/recipes/${editingRecipe.id}`
        : `${API_BASE}/recipes`;
      const method = editingRecipe ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          ingredients: formData.ingredients.map((ing) => ({
            raw_material_id: parseInt(ing.raw_material_id),
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
          })),
        }),
      });

      if (response.ok) {
        toast.success(editingRecipe ? "Receta actualizada" : "Receta creada");
        setIsDialogOpen(false);
        setEditingRecipe(null);
        setFormData({
          name: "",
          description: "",
          ingredients: [],
        });
        fetchRecipes();
      } else {
        toast.error("Error al guardar receta");
      }
    } catch (error) {
      toast.error("Error al guardar receta");
    }
  };

  const handleEdit = (recipe: IRecipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description || "",
      ingredients:
        recipe.ingredients?.map((ing) => ({
          raw_material_id: ing.raw_material_id.toString(),
          quantity: ing.quantity.toString(),
          unit: ing.unit,
        })) || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta receta?")) return;

    try {
      const response = await fetch(`${API_BASE}/recipes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Receta eliminada");
        fetchRecipes();
      } else {
        toast.error("Error al eliminar receta");
      }
    } catch (error) {
      toast.error("Error al eliminar receta");
    }
  };

  const handleRecalculate = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/recipes/${id}/recalculate`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Costo de receta recalculado");
        fetchRecipes();
      } else {
        toast.error("Error al recalcular receta");
      }
    } catch (error) {
      toast.error("Error al recalcular receta");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recetas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRecipe(null);
                setFormData({
                  name: "",
                  description: "",
                  ingredients: [],
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Receta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecipe ? "Editar Receta" : "Nueva Receta"}
              </DialogTitle>
              <DialogDescription>
                {editingRecipe
                  ? "Modifica la información de la receta"
                  : "Crea una nueva receta con ingredientes"}
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
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <Label>Ingredientes</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={currentIngredient.raw_material_id}
                    onValueChange={(value) =>
                      setCurrentIngredient({
                        ...currentIngredient,
                        raw_material_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Materia prima" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials.map((material) => (
                        <SelectItem
                          key={material.id}
                          value={material.id.toString()}
                        >
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cantidad"
                    value={currentIngredient.quantity}
                    onChange={(e) =>
                      setCurrentIngredient({
                        ...currentIngredient,
                        quantity: e.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <Select
                      value={currentIngredient.unit}
                      onValueChange={(value) =>
                        setCurrentIngredient({
                          ...currentIngredient,
                          unit: value as UnitType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="gr">gr</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="unidad">unidad</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addIngredient}>
                      Agregar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.ingredients.map((ing, index) => {
                    const material = rawMaterials.find(
                      (m) => m.id.toString() === ing.raw_material_id
                    );
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-muted rounded"
                      >
                        <span>
                          {material?.name} - {ing.quantity} {ing.unit}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
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
            <TableHead>Ingredientes</TableHead>
            <TableHead>Costo Receta</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const filtered = recipes.filter((recipe) => {
              const matchesSearch = recipe.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
              
              if (filterSupplier === "all") {
                return matchesSearch;
              }

              // Filtrar por proveedor: verificar si alguna materia prima de la receta pertenece al proveedor
              const hasSupplierMaterial = recipe.ingredients?.some((ingredient) => {
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron recetas
                  </TableCell>
                </TableRow>
              );
            }

            return filtered.map((recipe) => (
              <TableRow key={recipe.id}>
                <TableCell>{recipe.id}</TableCell>
                <TableCell>{recipe.name}</TableCell>
                <TableCell>
                  {" "}
                  {recipe.ingredients && recipe.ingredients.length > 0
                    ? recipe.ingredients
                        .map((ingredient) => ingredient.raw_material_name)
                        .join(", ")
                    : "Sin ingredientes"}
                  {recipe.ingredients?.length || 0} ingrediente(s)
                </TableCell>
                <TableCell>${recipe.recipe_cost.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRecalculate(recipe.id)}
                      title="Recalcular costo"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(recipe)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recipe.id)}
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

export default RecipesTab;
