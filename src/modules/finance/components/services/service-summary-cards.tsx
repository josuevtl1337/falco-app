import { Card, CardContent } from "@/components/ui/card";
import {
    IconCurrencyDollar,
    IconCircleCheck,
    IconClock,
} from "@tabler/icons-react";
import type { ServiceMonthlySummary } from "../../types";

interface ServiceSummaryCardsProps {
    summary: ServiceMonthlySummary | null;
    loading: boolean;
}

function formatCurrency(value: number): string {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    });
}

export default function ServiceSummaryCards({
    summary,
    loading,
}: ServiceSummaryCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-slate-800 bg-slate-950/50">
                        <CardContent className="p-5">
                            <div className="h-4 w-20 bg-slate-800 rounded animate-pulse mb-3" />
                            <div className="h-8 w-28 bg-slate-800 rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: "Total Mensual",
            value: formatCurrency(summary?.totalExpected ?? 0),
            subtitle: `${summary?.activeCount ?? 0} servicios activos`,
            icon: IconCurrencyDollar,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            gradient: "from-blue-950/50 to-slate-950/50",
            border: "hover:border-blue-700/50",
        },
        {
            title: "Pagados",
            value: `${summary?.paidCount ?? 0} / ${summary?.activeCount ?? 0}`,
            subtitle: formatCurrency(summary?.totalPaid ?? 0) + " pagado",
            icon: IconCircleCheck,
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/10",
            gradient: "from-emerald-950/50 to-slate-950/50",
            border: "hover:border-emerald-700/50",
        },
        {
            title: "Pendientes",
            value: `${summary?.pendingCount ?? 0}`,
            subtitle: formatCurrency(
                (summary?.totalExpected ?? 0) - (summary?.totalPaid ?? 0)
            ) + " por pagar",
            icon: IconClock,
            iconColor:
                (summary?.pendingCount ?? 0) > 0
                    ? "text-yellow-400"
                    : "text-slate-500",
            iconBg:
                (summary?.pendingCount ?? 0) > 0
                    ? "bg-yellow-500/10"
                    : "bg-slate-500/10",
            gradient:
                (summary?.pendingCount ?? 0) > 0
                    ? "from-yellow-950/50 to-slate-950/50"
                    : "from-slate-950/50 to-slate-950/50",
            border:
                (summary?.pendingCount ?? 0) > 0
                    ? "hover:border-yellow-700/50"
                    : "hover:border-slate-700/50",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card, idx) => (
                <Card
                    key={idx}
                    className={`border-slate-800 bg-gradient-to-br ${card.gradient} ${card.border} transition-all duration-300`}
                >
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-400">
                                {card.title}
                            </span>
                            <div
                                className={`p-2 rounded-lg ${card.iconBg}`}
                            >
                                <card.icon size={18} className={card.iconColor} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-100">
                            {card.value}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
