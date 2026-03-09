import { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SERVICE_CATEGORIES } from "../../types";
import type { Service } from "../../types";

const serviceSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    monthly_amount: z.number().min(0, "El monto debe ser mayor o igual a 0"),
    due_day: z.number().int().min(1, "Mínimo día 1").max(31, "Máximo día 31"),
    category: z.string().min(1, "La categoría es obligatoria"),
    icon: z.string().min(1, "El ícono es obligatorio"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface AddServiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ServiceFormData) => Promise<void>;
    editingService?: Service | null;
}

export default function AddServiceModal({
    open,
    onOpenChange,
    onSubmit,
    editingService,
}: AddServiceModalProps) {
    const isEditing = !!editingService;

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: "",
            monthly_amount: 0,
            due_day: 1,
            category: "general",
            icon: "bolt",
        },
    });

    useEffect(() => {
        if (open && editingService) {
            form.reset({
                name: editingService.name,
                monthly_amount: editingService.monthly_amount,
                due_day: editingService.due_day,
                category: editingService.category,
                icon: editingService.icon,
            });
        } else if (open && !editingService) {
            form.reset({
                name: "",
                monthly_amount: 0,
                due_day: 1,
                category: "general",
                icon: "bolt",
            });
        }
    }, [open, editingService, form]);

    const handleFormSubmit = async (data: ServiceFormData) => {
        await onSubmit(data);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-100">
                        {isEditing ? "Editar Servicio" : "Nuevo Servicio"}
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        {isEditing
                            ? "Modificá los datos del servicio fijo"
                            : "Agregá un nuevo servicio fijo mensual"}
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="space-y-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Nombre *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Internet, Alquiler..."
                                            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="monthly_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">
                                        Monto Mensual (ARS) *
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                                $
                                            </span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className="pl-7 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                                                value={field.value}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="due_day"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">
                                        Día de Vencimiento *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={31}
                                            placeholder="15"
                                            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                                            value={field.value}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Categoría *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                                <SelectValue placeholder="Seleccionar categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-slate-700">
                                            {SERVICE_CATEGORIES.map((cat) => (
                                                <SelectItem
                                                    key={cat.value}
                                                    value={cat.value}
                                                    className="text-slate-200 focus:bg-slate-800 focus:text-slate-100"
                                                >
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="bg-[var(--primary)] hover:opacity-90 text-white"
                            >
                                {form.formState.isSubmitting
                                    ? "Guardando..."
                                    : isEditing
                                        ? "Guardar Cambios"
                                        : "Crear Servicio"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
