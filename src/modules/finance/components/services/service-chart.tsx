import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import type { ServiceWithStatus } from "../../types";
import { SERVICE_CATEGORIES } from "../../types";

interface ServiceChartProps {
    services: ServiceWithStatus[];
}

const COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
];

function getCategoryLabel(category: string): string {
    return SERVICE_CATEGORIES.find((c) => c.value === category)?.label || category;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
            <p className="text-sm font-medium text-slate-200">{data.name}</p>
            <p className="text-xs text-slate-400 mt-1">
                ${data.value?.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
            </p>
        </div>
    );
}

export default function ServiceChart({ services }: ServiceChartProps) {
    // Aggregate by category
    const categoryMap = new Map<string, number>();
    for (const s of services) {
        const current = categoryMap.get(s.category) || 0;
        categoryMap.set(s.category, current + s.monthly_amount);
    }

    const chartData = Array.from(categoryMap.entries())
        .filter(([, value]) => value > 0)
        .map(([category, value]) => ({
            name: getCategoryLabel(category),
            value,
        }));

    if (chartData.length === 0) {
        return (
            <Card className="border-slate-800 bg-slate-950/50">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-200">
                        Distribución por Categoría
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">📊</span>
                        <p className="text-slate-500 text-sm">
                            Configurá los montos de los servicios
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader>
                <CardTitle className="text-lg text-slate-200">
                    Distribución por Categoría
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {chartData.map((_, idx) => (
                                <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                    stroke="transparent"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            formatter={(value: string) => (
                                <span className="text-xs text-slate-400">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
