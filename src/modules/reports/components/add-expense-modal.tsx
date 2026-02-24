import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "../types";
import type { ExpenseCategory } from "../types";

interface AddExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        amount: number;
        category: ExpenseCategory;
        description?: string;
        date: string;
    }) => Promise<void>;
    defaultMonth: number;
    defaultYear: number;
}

export default function AddExpenseModal({
    open,
    onOpenChange,
    onSubmit,
    defaultMonth,
    defaultYear,
}: AddExpenseModalProps) {
    const defaultDate = `${defaultYear}-${String(defaultMonth).padStart(2, "0")}-${String(
        new Date().getDate()
    ).padStart(2, "0")}`;

    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>("servicios");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(defaultDate);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            await onSubmit({
                amount: parseFloat(amount),
                category,
                description: description.trim() || undefined,
                date,
            });
            // Reset form
            setAmount("");
            setCategory("servicios");
            setDescription("");
            setDate(defaultDate);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-100">
                        Agregar Gasto
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Registra un nuevo gasto para el periodo seleccionado
                    </p>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Amount */}
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Monto (ARS) *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                $
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Categoría *</Label>
                        <Select
                            value={category}
                            onValueChange={(v) => setCategory(v as ExpenseCategory)}
                        >
                            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <SelectItem
                                        key={cat.value}
                                        value={cat.value}
                                        className="text-slate-200 focus:bg-slate-800 focus:text-slate-100"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{cat.emoji}</span>
                                            <span>{cat.label}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Fecha *</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-slate-200"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">
                            Descripción{" "}
                            <span className="text-slate-500">(opcional)</span>
                        </Label>
                        <Input
                            type="text"
                            placeholder="Ej: Factura luz febrero 2026"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? "Guardando..." : "Agregar Gasto"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
