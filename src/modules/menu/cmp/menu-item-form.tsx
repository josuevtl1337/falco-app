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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar el producto");
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
      <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Editar Producto" : "Agregar Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
}
