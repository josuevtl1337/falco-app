import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useReportExpenses } from "../hooks/use-advanced-reports";
import { EXPENSE_CATEGORIES } from "../types";
import type { MonthlyReport } from "../types";
import AddExpenseModal from "./add-expense-modal";
import {
    IconCirclePlus,
    IconTrash,
    IconReceipt,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface ExpensesSectionProps {
    month: number;
    year: number;
    report: MonthlyReport | null;
    onExpenseChange: () => void;
}

function getCategoryInfo(category: string) {
    return (
        EXPENSE_CATEGORIES.find((c) => c.value === category) || {
            value: category,
            label: category,
            emoji: "📝",
        }
    );
}

function getCategoryColor(category: string): string {
    switch (category) {
        case "servicios":
            return "border-yellow-500/50 text-yellow-400 bg-yellow-500/10";
        case "proveedores":
            return "border-blue-500/50 text-blue-400 bg-blue-500/10";
        case "supermercado":
            return "border-green-500/50 text-green-400 bg-green-500/10";
        case "otros":
            return "border-slate-500/50 text-slate-400 bg-slate-500/10";
        default:
            return "border-slate-500/50 text-slate-400 bg-slate-500/10";
    }
}

export default function ExpensesSection({
    month,
    year,
    report,
    onExpenseChange,
}: ExpensesSectionProps) {
    const [showModal, setShowModal] = useState(false);
    const { expenses, addExpense, deleteExpense } = useReportExpenses(
        month,
        year
    );

    const handleAddExpense = async (payload: {
        amount: number;
        category: string;
        description?: string;
        date: string;
    }) => {
        try {
            await addExpense(payload as any);
            toast.success("Gasto agregado correctamente");
            onExpenseChange();
            setShowModal(false);
        } catch {
            toast.error("Error al agregar gasto");
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        try {
            await deleteExpense(id);
            toast.success("Gasto eliminado");
            onExpenseChange();
        } catch {
            toast.error("Error al eliminar gasto");
        }
    };

    return (
        <div className="space-y-4">
            {/* Category breakdown cards */}
            {report?.expenses?.byCategory &&
                report.expenses.byCategory.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {report.expenses.byCategory.map((cat) => {
                            const info = getCategoryInfo(cat.category);
                            const percentage =
                                report.expenses.total > 0
                                    ? ((cat.total / report.expenses.total) * 100).toFixed(0)
                                    : "0";

                            return (
                                <Card
                                    key={cat.category}
                                    className="border-slate-800 bg-slate-900/50"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg">{info.emoji}</span>
                                            <span className="text-xs text-slate-500">
                                                {percentage}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-1">{info.label}</p>
                                        <p className="text-lg font-bold text-slate-200">
                                            $
                                            {cat.total.toLocaleString("es-AR", {
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {cat.count}{" "}
                                            {cat.count === 1 ? "registro" : "registros"}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

            {/* Expenses table */}
            <Card className="border-slate-800 bg-slate-950/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconReceipt size={20} className="text-red-400" />
                            <CardTitle className="text-lg text-slate-200">
                                Gastos del Mes
                            </CardTitle>
                        </div>
                        <Button
                            onClick={() => setShowModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm"
                            size="sm"
                        >
                            <IconCirclePlus size={16} className="mr-1" />
                            Agregar Gasto
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <span className="text-5xl">💸</span>
                            <p className="text-slate-400 text-sm">
                                No hay gastos registrados para este período
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowModal(true)}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 mt-2"
                            >
                                <IconCirclePlus size={16} className="mr-1" />
                                Registrar primer gasto
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-800 bg-slate-950/50">
                            <Table>
                                <TableHeader className="bg-slate-900/50">
                                    <TableRow className="border-slate-800 hover:bg-slate-900/50">
                                        <TableHead className="text-slate-300">Fecha</TableHead>
                                        <TableHead className="text-slate-300">Categoría</TableHead>
                                        <TableHead className="text-slate-300">
                                            Descripción
                                        </TableHead>
                                        <TableHead className="text-right text-slate-300">
                                            Monto
                                        </TableHead>
                                        <TableHead className="text-center text-slate-300 w-[60px]">

                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map((expense) => {
                                        const catInfo = getCategoryInfo(expense.category);
                                        return (
                                            <TableRow
                                                key={expense.id}
                                                className="border-slate-800 hover:bg-slate-900/30"
                                            >
                                                <TableCell className="text-slate-300 text-sm">
                                                    {new Date(expense.date).toLocaleDateString("es-AR", {
                                                        day: "2-digit",
                                                        month: "short",
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={getCategoryColor(expense.category)}
                                                    >
                                                        {catInfo.emoji} {catInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">
                                                    {expense.description || "—"}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-red-400 text-sm">
                                                    -$
                                                    {expense.amount?.toLocaleString("es-AR", {
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <IconTrash size={14} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddExpenseModal
                open={showModal}
                onOpenChange={setShowModal}
                onSubmit={handleAddExpense}
                defaultMonth={month}
                defaultYear={year}
            />
        </div>
    );
}
