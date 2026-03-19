import { useState, useEffect, useMemo } from "react";
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
  IconToolsKitchen2,
  IconCalculator,
  IconX,
} from "@tabler/icons-react";
import { IRecipe, IRawMaterial, UnitType } from "../types";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/cost-engine";

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RecipesTab() {
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<IRawMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<IRecipe | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ingredients: [] as Array<{ raw_material_id: string; quantity: string; unit: UnitType }>,
  });
  const [currentIngredient, setCurrentIngredient] = useState({
    raw_material_id: "",
    quantity: "",
    unit: "gr" as UnitType,
  });
  const [ingredientSearch, setIngredientSearch] = useState("");

  useEffect(() => {
    fetchRecipes();
    fetchRawMaterials();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${API_BASE}/recipes`);
      setRecipes(await response.json());
    } catch {
      toast.error("Error al cargar recetas");
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE}/raw-materials`);
      setRawMaterials(await response.json());
    } catch {
      toast.error("Error al cargar materias primas");
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!ingredientSearch.trim()) return rawMaterials;
    const term = ingredientSearch.toLowerCase();
    return rawMaterials.filter(
      (m) => m.name.toLowerCase().includes(term) || m.supplier_name?.toLowerCase().includes(term)
    );
  }, [rawMaterials, ingredientSearch]);

  const addIngredient = () => {
    if (!currentIngredient.raw_material_id || !currentIngredient.quantity) {
      toast.error("Completa todos los campos del ingrediente");
      return;
    }
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ...currentIngredient }],
    });
    setCurrentIngredient({ raw_material_id: "", quantity: "", unit: "gr" });
    setIngredientSearch("");
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
      const url = editingRecipe ? `${API_BASE}/recipes/${editingRecipe.id}` : `${API_BASE}/recipes`;
      const response = await fetch(url, {
        method: editingRecipe ? "PUT" : "POST",
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
        resetForm();
        fetchRecipes();
      } else {
        toast.error("Error al guardar receta");
      }
    } catch {
      toast.error("Error al guardar receta");
    }
  };

  function resetForm() {
    setEditingRecipe(null);
    setFormData({ name: "", description: "", ingredients: [] });
    setCurrentIngredient({ raw_material_id: "", quantity: "", unit: "gr" });
    setIngredientSearch("");
  }

  const handleEdit = (recipe: IRecipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description || "",
      ingredients: recipe.ingredients?.map((ing) => ({
        raw_material_id: ing.raw_material_id.toString(),
        quantity: ing.quantity.toString(),
        unit: ing.unit,
      })) || [],
    });
    setIngredientSearch("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta receta?")) return;
    try {
      const response = await fetch(`${API_BASE}/recipes/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Receta eliminada");
        fetchRecipes();
      } else {
        toast.error("Error al eliminar receta");
      }
    } catch {
      toast.error("Error al eliminar receta");
    }
  };

  const handleRecalculate = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/recipes/${id}/recalculate`, { method: "POST" });
      if (response.ok) {
        toast.success("Costo recalculado");
        fetchRecipes();
      } else {
        toast.error("Error al recalcular");
      }
    } catch {
      toast.error("Error al recalcular");
    }
  };

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar receta..."
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
          Agregar Receta
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <IconToolsKitchen2 size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron recetas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((recipe) => (
            <Card
              key={recipe.id}
              className="border-border/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="pt-4 pb-3 px-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-purple-400">
                      ${formatARS(recipe.recipe_cost)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">costo receta</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ing, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {ing.raw_material_name} ({ing.quantity}{ing.unit})
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Sin ingredientes</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleRecalculate(recipe.id)}
                    title="Recalcular costo"
                  >
                    <IconCalculator size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(recipe)}
                  >
                    <IconPencil size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(recipe.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? "Editar Receta" : "Nueva Receta"}</DialogTitle>
            <DialogDescription>
              {editingRecipe ? "Modifica la receta y sus ingredientes" : "Crea una nueva receta con ingredientes"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="recipe_name">Nombre *</Label>
              <Input
                id="recipe_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="recipe_description">Descripción</Label>
              <Textarea
                id="recipe_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Ingredient adder */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label>Ingredientes</Label>

              {/* Search + add row */}
              <div className="space-y-2">
                <div className="relative">
                  <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar materia prima..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                  <Select
                    value={currentIngredient.raw_material_id}
                    onValueChange={(value) =>
                      setCurrentIngredient({ ...currentIngredient, raw_material_id: value })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Materia prima" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                          {material.supplier_name ? ` (${material.supplier_name})` : ""}
                        </SelectItem>
                      ))}
                      {filteredMaterials.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                          No se encontraron materias primas
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cant."
                    value={currentIngredient.quantity}
                    onChange={(e) =>
                      setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })
                    }
                    className="w-20 h-9"
                  />
                  <Select
                    value={currentIngredient.unit}
                    onValueChange={(value) =>
                      setCurrentIngredient({ ...currentIngredient, unit: value as UnitType })
                    }
                  >
                    <SelectTrigger className="w-24 h-9">
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
                  <Button type="button" size="sm" className="h-9" onClick={addIngredient}>
                    <IconPlus size={14} />
                  </Button>
                </div>
              </div>

              {/* Ingredient list */}
              {formData.ingredients.length > 0 && (
                <div className="space-y-1.5">
                  {formData.ingredients.map((ing, index) => {
                    const material = rawMaterials.find((m) => m.id.toString() === ing.raw_material_id);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{material?.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {ing.quantity} {ing.unit}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                          onClick={() => removeIngredient(index)}
                        >
                          <IconX size={14} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {formData.ingredients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Agrega ingredientes usando el formulario de arriba
                </p>
              )}
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

export default RecipesTab;
