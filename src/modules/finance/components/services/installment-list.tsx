import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    IconAlertCircle,
    IconCircleCheck,
    IconCirclePlus,
    IconClock,
    IconCreditCardPay,
    IconEdit,
    IconPackage,
    IconTrash,
} from "@tabler/icons-react";
import type { InstallmentWithStatus, PaymentStatus } from "../../types";

interface InstallmentListProps {
    installments: InstallmentWithStatus[];
    loading: boolean;
    onRegisterPayment: (installment: InstallmentWithStatus) => void;
    onEdit: (installment: InstallmentWithStatus) => void;
    onDelete: (installment: InstallmentWithStatus) => void;
    onDeletePayment: (paymentId: number) => void;
    onAddNew: () => void;
}

function getStatusConfig(status: PaymentStatus) {
    switch (status) {
        case "paid":
            return {
                icon: IconCircleCheck,
                label: "Pagado",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/30",
            };
        case "pending":
            return {
                icon: IconClock,
                label: "Pendiente",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10 border-yellow-500/30",
            };
        case "overdue":
            return {
                icon: IconAlertCircle,
                label: "Vencido",
                color: "text-red-400",
                bg: "bg-red-500/10 border-red-500/30",
            };
    }
}

function formatCurrency(value: number): string {
    return "$" + value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export default function InstallmentList({
    installments,
    loading,
    onRegisterPayment,
    onEdit,
    onDelete,
    onDeletePayment,
    onAddNew,
}: InstallmentListProps) {
    if (loading) {
        return (
            <Card className="border-slate-800 bg-slate-950/50">
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-200">
                        Gastos en Cuotas
                    </CardTitle>
                    <Button
                        onClick={onAddNew}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
                        size="sm"
                    >
                        <IconCirclePlus size={16} className="mr-1" />
                        Nueva Cuota
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {installments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <span className="text-4xl text-cyan-300">$</span>
                        <p className="text-slate-400 text-sm">
                            No hay cuotas activas para este periodo
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAddNew}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 mt-2"
                        >
                            <IconCirclePlus size={16} className="mr-1" />
                            Cargar primer gasto en cuotas
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {installments.map((installment) => {
                            const statusConfig = getStatusConfig(installment.status);
                            const StatusIcon = statusConfig.icon;
                            const progress = (installment.installment_number / installment.total_months) * 100;

                            return (
                                <div
                                    key={installment.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:border-cyan-700/40 transition-all"
                                >
                                    <div className="p-2 rounded-lg bg-cyan-500/10">
                                        <IconPackage size={18} className="text-cyan-300" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-slate-200 truncate">
                                                {installment.name}
                                            </p>
                                            <span className="text-xs text-cyan-300">
                                                {installment.installment_number}/{installment.total_months}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Vence dia {installment.due_day} - {formatCurrency(installment.monthly_amount)}
                                        </p>
                                        <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-cyan-500"
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {installment.status === "paid" && installment.amount_paid != null && (
                                        <span className="text-sm font-medium text-emerald-400">
                                            {formatCurrency(installment.amount_paid)}
                                        </span>
                                    )}

                                    <Badge
                                        variant="outline"
                                        className={`${statusConfig.bg} ${statusConfig.color} text-xs`}
                                    >
                                        <StatusIcon size={12} className="mr-1" />
                                        {statusConfig.label}
                                    </Badge>

                                    <div className="flex items-center gap-1">
                                        {installment.status !== "paid" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRegisterPayment(installment)}
                                                className="h-8 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                                title="Registrar pago"
                                            >
                                                <IconCreditCardPay size={16} />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    installment.payment_id &&
                                                    onDeletePayment(installment.payment_id)
                                                }
                                                className="h-8 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                title="Anular pago"
                                            >
                                                <IconTrash size={14} />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(installment)}
                                            className="h-8 px-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                            title="Editar"
                                        >
                                            <IconEdit size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(installment)}
                                            className="h-8 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                            title="Eliminar"
                                        >
                                            <IconTrash size={14} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
