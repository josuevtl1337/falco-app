import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface IMenuItem {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  price: number;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  category_id?: string | number;
  category_name?: string;
  recipe_id?: number | null;
  recipe_name?: string | null;
}

interface ICostRecipeIngredient {
  id?: number;
  raw_material_id: number;
  raw_material_name?: string;
  quantity: number;
  unit: "kg" | "gr" | "l" | "ml" | "unidad";
}

interface ICostRecipe {
  id: number;
  name: string;
  description?: string;
  recipe_cost: number;
  ingredients?: ICostRecipeIngredient[];
}

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  category_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== null && val !== undefined && val !== "", {
      message: "La categoría es obligatoria",
    }),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: IMenuItem | null;
  categories: Array<{ category_id: string; name: string }>;
  onSuccess?: () => void;
}

export default function MenuItemForm({
  open,
  onOpenChange,
  item,
  categories,
  onSuccess,
}: MenuItemFormProps) {
  const isEditing = !!item;
  const [costRecipes, setCostRecipes] = useState<ICostRecipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("none");
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      category_id: "",
      is_active: true,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) return;

    fetch("http://localhost:3001/api/cost-engine/recipes")
      .then((res) => res.json())
      .then((data: ICostRecipe[]) => setCostRecipes(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error loading cost recipes:", err);
        setCostRecipes([]);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (item) {
      form.reset({
        name: item.name || "",
        slug: item.slug || "",
        description: item.description || "",
        price: item.price || 0,
        category_id: item.category_id?.toString() || "",
        is_active: (item.is_active ?? 1) === 1,
      });
      setSelectedRecipeId(item.recipe_id ? String(item.recipe_id) : "none");
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        price: 0,
        category_id: "",
        is_active: true,
      });
      setSelectedRecipeId("none");
    }
  }, [item, open, form]);

  const selectedRecipe = useMemo(
    () => costRecipes.find((recipe) => String(recipe.id) === selectedRecipeId),
    [costRecipes, selectedRecipeId]
  );

  const filteredRecipes = useMemo(() => {
    const term = recipeSearchTerm.trim().toLowerCase();
    if (!term) return costRecipes;
    return costRecipes.filter((recipe) => recipe.name.toLowerCase().includes(term));
  }, [costRecipes, recipeSearchTerm]);

  const onSubmit = async (data: FormData) => {
    try {
      const url = isEditing
        ? `http://localhost:3001/api/menu-items/${item?.id}`
        : "http://localhost:3001/api/menu-items";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          recipe_id: selectedRecipeId === "none" ? null : Number(selectedRecipeId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar el producto");
      }

      toast.success(
        isEditing
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente"
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el producto"
      );
    }
  };

  const saveRecipeLink = async () => {
    if (!item) return;
    try {
      const response = await fetch(`http://localhost:3001/api/menu-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: selectedRecipeId === "none" ? null : Number(selectedRecipeId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al vincular receta");
      }

      toast.success("Receta vinculada correctamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error linking recipe:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al vincular receta"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Editar Producto" : "Agregar Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2 bg-[#181c1f]">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="recipe" disabled={!isEditing}>
              Receta {!isEditing && "(Guardar primero)"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Nombre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Café con Leche"
                            className="bg-[#181c1f] border-[var(--card-border)] text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Código (slug)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: CAFE-1"
                            className="bg-[#181c1f] border-[var(--card-border)] text-white placeholder:text-gray-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Categoría *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#181c1f] border-[var(--card-border)] text-white">
                              <SelectValue placeholder="Seleccionar categoría">
                                {field.value &&
                                  categories.find(
                                    (cat) =>
                                      cat.category_id.toString() === field.value?.toString()
                                  )?.name}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#181c1f] border-[var(--card-border)] text-white">
                            {categories.map((category) => (
                              <SelectItem
                                key={category.category_id}
                                value={category.category_id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Precio *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="bg-[#181c1f] border-[var(--card-border)] text-white placeholder:text-gray-400"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del producto..."
                          className="bg-[#181c1f] border-[var(--card-border)] text-white placeholder:text-gray-400 resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[var(--card-border)] p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white">Estado</FormLabel>
                        <div className="text-sm text-gray-400">
                          Producto activo en la carta
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-[var(--card-border)] text-white hover:bg-[var(--card-border)]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Guardando..."
                      : isEditing
                      ? "Actualizar Producto"
                      : "Crear Producto"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="recipe" className="space-y-4">
            <div className="rounded-lg border border-[var(--card-border)] p-4 bg-[#181c1f] space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Vincular receta</h3>
                <p className="text-sm text-gray-400">
                  Selecciona una receta existente del módulo Motor de Costos.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Receta</Label>
                <Input
                  placeholder="Buscar receta..."
                  value={recipeSearchTerm}
                  onChange={(e) => setRecipeSearchTerm(e.target.value)}
                  className="bg-[#0f1214] border-[var(--card-border)] text-white placeholder:text-gray-500"
                />
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger className="bg-[#0f1214] border-[var(--card-border)] text-white">
                    <SelectValue placeholder="Seleccionar receta" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181c1f] border-[var(--card-border)] text-white">
                    <SelectItem value="none">Sin receta</SelectItem>
                    {filteredRecipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={String(recipe.id)}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRecipe ? (
                <div className="rounded-lg border border-[var(--card-border)] bg-[#0f1214] p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{selectedRecipe.name}</p>
                      {selectedRecipe.description && (
                        <p className="text-sm text-gray-400">{selectedRecipe.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(selectedRecipe.ingredients || []).length === 0 ? (
                      <span className="text-xs text-gray-500">Sin ingredientes definidos</span>
                    ) : (
                      selectedRecipe.ingredients?.map((ingredient) => (
                        <Badge
                          key={`${ingredient.raw_material_id}-${ingredient.quantity}-${ingredient.unit}`}
                          variant="outline"
                          className="text-[11px] border-[var(--card-border)]"
                        >
                          {ingredient.raw_material_name || `Insumo #${ingredient.raw_material_id}`} ({ingredient.quantity}
                          {ingredient.unit})
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--card-border)] p-4 text-sm text-gray-400">
                  Este producto no tiene receta vinculada.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[var(--card-border)] text-white hover:bg-[var(--card-border)]"
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={saveRecipeLink}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              >
                Guardar Receta y Salir
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
