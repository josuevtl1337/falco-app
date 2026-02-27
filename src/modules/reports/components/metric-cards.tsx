import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    IconTrendingUp,
    IconTrendingDown,
    IconMinus,
} from "@tabler/icons-react";
import type { MonthlyReport } from "../types";

interface MetricCardsProps {
    data: MonthlyReport | null;
    loading: boolean;
}

function formatCurrency(value: number): string {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    });
}

function VariationBadge({ value }: { value: number | null }) {
    if (value === null || value === undefined) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <IconMinus size={12} />
                Sin datos previos
            </span>
        );
    }

    const isPositive = value > 0;
    const isNegative = value < 0;

    return (
        <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive
                    ? "text-emerald-400"
                    : isNegative
                        ? "text-red-400"
                        : "text-slate-400"
                }`}
        >
            {isPositive ? (
                <IconTrendingUp size={14} />
            ) : isNegative ? (
                <IconTrendingDown size={14} />
            ) : (
                <IconMinus size={14} />
            )}
            {isPositive ? "+" : ""}
            {value.toFixed(1)}% vs mes anterior
        </span>
    );
}

function SkeletonCard() {
    return (
        <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
                <div className="h-8 w-32 bg-slate-800 rounded animate-pulse mb-2" />
                <div className="h-3 w-28 bg-slate-800/50 rounded animate-pulse" />
            </CardContent>
        </Card>
    );
}

export default function MetricCards({ data, loading }: MetricCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    const metrics = [
        {
            title: "Total Ingresado",
            value: formatCurrency(data?.income.total ?? 0),
            subtitle: `${data?.income.orderCount ?? 0} órdenes · Prom. ${formatCurrency(
                data?.income.avgTicket ?? 0
            )}`,
            variation: data?.variation.incomePercent ?? null,
            gradient: "from-blue-950/50 to-slate-950/50",
            hoverBorder: "hover:border-blue-700/50",
            textColor: "text-blue-400",
        },
        {
            title: "Total Gastado",
            value: formatCurrency(data?.expenses.total ?? 0),
            subtitle: `${data?.expenses.byCategory?.length ?? 0} categorías`,
            variation: data?.variation.expensesPercent ?? null,
            gradient: "from-red-950/50 to-slate-950/50",
            hoverBorder: "hover:border-red-700/50",
            textColor: "text-red-400",
            invertVariation: true,
        },
        {
            title: "Ganancia Neta",
            value: formatCurrency(data?.netProfit ?? 0),
            subtitle:
                (data?.netProfit ?? 0) >= 0
                    ? "Balance positivo"
                    : "Balance negativo",
            variation: data?.variation.profitPercent ?? null,
            gradient:
                (data?.netProfit ?? 0) >= 0
                    ? "from-emerald-950/50 to-slate-950/50"
                    : "from-red-950/50 to-slate-950/50",
            hoverBorder:
                (data?.netProfit ?? 0) >= 0
                    ? "hover:border-emerald-700/50"
                    : "hover:border-red-700/50",
            textColor:
                (data?.netProfit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
        },
        {
            title: "Margen",
            value:
                data?.income.total && data.income.total > 0
                    ? `${(((data?.netProfit ?? 0) / data.income.total) * 100).toFixed(1)}%`
                    : "—",
            subtitle: "Sobre ingresos totales",
            variation: null,
            gradient: "from-purple-950/50 to-slate-950/50",
            hoverBorder: "hover:border-purple-700/50",
            textColor: "text-purple-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
                <Card
                    key={idx}
                    className={`border-slate-800 bg-gradient-to-br ${metric.gradient} ${metric.hoverBorder} transition-all duration-300`}
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300">
                            {metric.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${metric.textColor}`}>
                            {metric.value}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{metric.subtitle}</p>
                        <div className="mt-2">
                            <VariationBadge value={metric.variation} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
