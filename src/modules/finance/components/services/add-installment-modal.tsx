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
import type { Installment } from "../../types";

const installmentSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    monthly_amount: z.number().min(0, "El monto debe ser mayor o igual a 0"),
    due_day: z.number().int().min(1, "Minimo dia 1").max(31, "Maximo dia 31"),
    total_months: z.number().int().min(1, "Debe tener al menos 1 cuota"),
    start_month: z.number().int().min(1, "Mes minimo 1").max(12, "Mes maximo 12"),
    start_year: z.number().int().min(2020, "Ano invalido").max(2100, "Ano invalido"),
});

type InstallmentFormData = z.infer<typeof installmentSchema>;

interface AddInstallmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: InstallmentFormData) => Promise<void>;
    editingInstallment?: Installment | null;
    defaultMonth: number;
    defaultYear: number;
}

export default function AddInstallmentModal({
    open,
    onOpenChange,
    onSubmit,
    editingInstallment,
    defaultMonth,
    defaultYear,
}: AddInstallmentModalProps) {
    const isEditing = !!editingInstallment;

    const form = useForm<InstallmentFormData>({
        resolver: zodResolver(installmentSchema),
        defaultValues: {
            name: "",
            monthly_amount: 0,
            due_day: 1,
            total_months: 12,
            start_month: defaultMonth,
            start_year: defaultYear,
        },
    });

    useEffect(() => {
        if (open && editingInstallment) {
            form.reset({
                name: editingInstallment.name,
                monthly_amount: editingInstallment.monthly_amount,
                due_day: editingInstallment.due_day,
                total_months: editingInstallment.total_months,
                start_month: editingInstallment.start_month,
                start_year: editingInstallment.start_year,
            });
        } else if (open) {
            form.reset({
                name: "",
                monthly_amount: 0,
                due_day: 1,
                total_months: 12,
                start_month: defaultMonth,
                start_year: defaultYear,
            });
        }
    }, [defaultMonth, defaultYear, editingInstallment, form, open]);

    const handleFormSubmit = async (data: InstallmentFormData) => {
        await onSubmit(data);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-100">
                        {isEditing ? "Editar Gasto en Cuotas" : "Nuevo Gasto en Cuotas"}
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Carga compras financiadas, prestamos o gastos que terminan despues de una cantidad fija de meses.
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Nombre *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Freezer"
                                            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="monthly_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Monto por cuota *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="pl-7 bg-slate-900 border-slate-700 text-slate-200"
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
                                name="total_months"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Cantidad de cuotas *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="bg-slate-900 border-slate-700 text-slate-200"
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="due_day"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Vence dia *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={31}
                                                className="bg-slate-900 border-slate-700 text-slate-200"
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
                                name="start_month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Mes inicio *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={12}
                                                className="bg-slate-900 border-slate-700 text-slate-200"
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
                                name="start_year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Ano inicio *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={2020}
                                                max={2100}
                                                className="bg-slate-900 border-slate-700 text-slate-200"
                                                value={field.value}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || defaultYear)}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                            >
                                {form.formState.isSubmitting
                                    ? "Guardando..."
                                    : isEditing
                                        ? "Guardar Cambios"
                                        : "Crear Cuota"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
