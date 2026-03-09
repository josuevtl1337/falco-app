import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    IconCircleCheck,
    IconClock,
    IconAlertCircle,
    IconCirclePlus,
    IconEdit,
    IconCreditCardPay,
    IconTrash,
    IconWifi,
    IconHome,
    IconCode,
    IconReceipt,
    IconUser,
    IconBolt,
    IconDots,
} from "@tabler/icons-react";
import type { ServiceWithStatus, PaymentStatus } from "../../types";

interface ServiceListProps {
    services: ServiceWithStatus[];
    loading: boolean;
    onRegisterPayment: (service: ServiceWithStatus) => void;
    onEdit: (service: ServiceWithStatus) => void;
    onDelete: (service: ServiceWithStatus) => void;
    onDeletePayment: (paymentId: number) => void;
    onAddNew: () => void;
}

const ICON_MAP: Record<string, typeof IconBolt> = {
    wifi: IconWifi,
    home: IconHome,
    code: IconCode,
    receipt: IconReceipt,
    user: IconUser,
    bolt: IconBolt,
    dots: IconDots,
};

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

export default function ServiceList({
    services,
    loading,
    onRegisterPayment,
    onEdit,
    onDelete,
    onDeletePayment,
    onAddNew,
}: ServiceListProps) {
    if (loading) {
        return (
            <Card className="border-slate-800 bg-slate-950/50">
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-16 bg-slate-800/50 rounded-lg animate-pulse"
                            />
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
                        Servicios Fijos
                    </CardTitle>
                    <Button
                        onClick={onAddNew}
                        className="bg-[var(--primary)] hover:opacity-90 text-white text-sm"
                        size="sm"
                    >
                        <IconCirclePlus size={16} className="mr-1" />
                        Nuevo Servicio
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <span className="text-5xl">🏠</span>
                        <p className="text-slate-400 text-sm">
                            No hay servicios configurados
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAddNew}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 mt-2"
                        >
                            <IconCirclePlus size={16} className="mr-1" />
                            Agregar primer servicio
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {services.map((service) => {
                            const statusConfig = getStatusConfig(service.status);
                            const StatusIcon = statusConfig.icon;
                            const ServiceIcon = ICON_MAP[service.icon] || IconBolt;

                            return (
                                <div
                                    key={service.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-all"
                                >
                                    {/* Icon */}
                                    <div className="p-2 rounded-lg bg-slate-800/50">
                                        <ServiceIcon
                                            size={18}
                                            className="text-slate-400"
                                        />
                                    </div>

                                    {/* Name + Due day */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">
                                            {service.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Vence día {service.due_day} ·{" "}
                                            {formatCurrency(service.monthly_amount)}
                                        </p>
                                    </div>

                                    {/* Payment amount if paid */}
                                    {service.status === "paid" && service.amount_paid != null && (
                                        <span className="text-sm font-medium text-emerald-400">
                                            {formatCurrency(service.amount_paid)}
                                        </span>
                                    )}

                                    {/* Status badge */}
                                    <Badge
                                        variant="outline"
                                        className={`${statusConfig.bg} ${statusConfig.color} text-xs`}
                                    >
                                        <StatusIcon size={12} className="mr-1" />
                                        {statusConfig.label}
                                    </Badge>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {service.status !== "paid" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRegisterPayment(service)}
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
                                                    service.payment_id &&
                                                    onDeletePayment(service.payment_id)
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
                                            onClick={() => onEdit(service)}
                                            className="h-8 px-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                            title="Editar"
                                        >
                                            <IconEdit size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(service)}
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
