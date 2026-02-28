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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { API_BASE } from "@/lib/api";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  const [stockItems, setStockItems] = useState<any[]>([]);
  const [recipeItems, setRecipeItems] = useState<{ id: number; name: string; quantity: number; unit: string }[]>([]);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(0);

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
    if (open) {
      // Fetch available raw materials (ingredients)
      fetch(`${API_BASE}/stock/raw-materials`)
        .then(res => res.json())
        .then(data => setStockItems(data))
        .catch(err => console.error("Error loading stock:", err));
    }

    if (open && item) {
      // Fetch existing recipe
      fetch(`${API_BASE}/stock/menu-item-recipes/${item.id}`)
        .then(res => res.json())
        .then((data: any[]) => {
          const mapped = data.map(d => ({
            id: d.raw_material_id,
            name: d.raw_material_name,
            quantity: d.quantity,
            unit: d.unit
          }));
          setRecipeItems(mapped);
        })
        .catch(err => console.error("Error loading recipe:", err));
    } else {
      setRecipeItems([]);
    }
  }, [open, item]);

  useEffect(() => {
    if (item && open) {
      form.reset({
        name: item.name || "",
        slug: item.slug || "",
        description: item.description || "",
        price: item.price || 0,
        category_id: item.category_id?.toString() || "",
        is_active: (item.is_active ?? 1) === 1,
      });
    } else if (!item && open) {
      form.reset({
        name: "",
        slug: "",
        description: "",
        price: 0,
        category_id: "",
        is_active: true,
      });
    }
  }, [item, open, form]);

  const handleAddIngredient = () => {
    if (!selectedStockId || selectedQuantity <= 0) return;
    const stockItem = stockItems.find(s => s.id === Number(selectedStockId));
    if (!stockItem) return;

    setRecipeItems(prev => {
      const exists = prev.find(p => p.id === stockItem.id);
      if (exists) {
        return prev.map(p => p.id === stockItem.id ? { ...p, quantity: selectedQuantity } : p);
      }
      return [...prev, { id: stockItem.id, name: stockItem.name, quantity: selectedQuantity, unit: stockItem.purchase_unit }];
    });
    setSelectedStockId("");
    setSelectedQuantity(0);
  };

  const handleRemoveIngredient = (id: number) => {
    setRecipeItems(prev => prev.filter(p => p.id !== id));
  };

  const saveRecipe = async () => {
    if (!item) return; // Only save recipe if item exists
    try {
      const ingredients = recipeItems.map(r => ({
        raw_material_id: r.id,
        quantity: r.quantity,
        unit: r.unit
      }));

      await fetch(`${API_BASE}/stock/menu-item-recipes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients })
      });
      toast.success("Receta actualizada");
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la receta");
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const url = isEditing
        ? `${API_BASE}/menu-items/${item?.id}`
        : `${API_BASE}/menu-items`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar el producto");
      }

      // If creating new item, we might need the ID to save the recipe (if we wanted to do it in one go).
      // But for now let's assume detail is saved first.

      // If editing, save recipe as well
      if (isEditing) {
        await saveRecipe();
      }

      toast.success(
        isEditing
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente",
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el producto",
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
            <TabsTrigger value="recipe" disabled={!isEditing}>Receta {(!isEditing) && "(Guardar primero)"}</TabsTrigger>
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
                                      cat.category_id.toString() ===
                                      field.value?.toString(),
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
            <div className="rounded-lg border border-[var(--card-border)] p-4 bg-[#181c1f]">
              <h3 className="text-lg font-semibold mb-4 text-white">Ingredientes</h3>
              <div className="flex gap-2 items-end mb-4">
                <div className="flex-1">
                  <Label className="text-white">Insumo</Label>
                  <Select value={selectedStockId} onValueChange={setSelectedStockId}>
                    <SelectTrigger className="mt-1 bg-[#0f1214] border-[var(--card-border)] text-white">
                      <SelectValue placeholder="Seleccionar insumo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181c1f] border-[var(--card-border)] text-white h-[200px]">
                      {stockItems.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.purchase_unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-white">Cantidad</Label>
                  <Input
                    type="number"
                    className="mt-1 bg-[#0f1214] border-[var(--card-border)] text-white"
                    value={selectedQuantity}
                    onChange={e => setSelectedQuantity(parseFloat(e.target.value))}
                  />
                </div>
                <Button onClick={handleAddIngredient} type="button" variant="secondary">Agregar</Button>
              </div>

              <div className="space-y-2">
                {recipeItems.length === 0 && <p className="text-gray-500 text-sm">No hay ingredientes definidos.</p>}
                {recipeItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-[#0f1214] border border-[var(--card-border)]">
                    <span className="text-sm font-medium text-white">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{item.quantity} {item.unit}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveIngredient(item.id)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300">
                        &times;
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                onClick={async () => {
                  await saveRecipe();
                  onOpenChange(false);
                  onSuccess?.();
                }}
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

