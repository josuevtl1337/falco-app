import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useChartData } from "../hooks/use-advanced-reports";

interface RevenueChartProps {
    months?: number;
}

function formatCurrency(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value.toLocaleString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
            <p className="text-sm font-medium text-slate-200 mb-2">{label}</p>
            {payload.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-400">{entry.name}:</span>
                    <span className="font-medium text-slate-200">
                        ${entry.value?.toLocaleString() ?? 0}
                    </span>
                </div>
            ))}
            {payload.length >= 2 && (
                <div className="mt-2 pt-2 border-t border-slate-700 flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-slate-400">Ganancia:</span>
                    <span
                        className={`font-medium ${(payload[0]?.value ?? 0) - (payload[1]?.value ?? 0) >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                    >
                        $
                        {(
                            (payload[0]?.value ?? 0) - (payload[1]?.value ?? 0)
                        ).toLocaleString()}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function RevenueChart({ months = 12 }: RevenueChartProps) {
    const { data, loading } = useChartData(months);

    const chartData = data.map((d) => ({
        ...d,
        label: `${d.month} ${d.year}`,
    }));

    return (
        <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader>
                <CardTitle className="text-lg text-slate-200">
                    Ingresos vs Gastos
                </CardTitle>
                <p className="text-sm text-slate-500">Últimos {months} meses</p>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[350px] flex items-center justify-center">
                        <div className="text-slate-500 animate-pulse">
                            Cargando gráfico...
                        </div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-[350px] flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">📊</span>
                        <p className="text-slate-500 text-sm">
                            No hay datos históricos disponibles
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} barCategoryGap="20%">
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e293b"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={{ stroke: "#334155" }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#94a3b8", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: 16 }}
                                formatter={(value: string) => (
                                    <span className="text-xs text-slate-400">{value}</span>
                                )}
                            />
                            <Bar
                                dataKey="income"
                                name="Ingresos"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                            <Bar
                                dataKey="expenses"
                                name="Gastos"
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
