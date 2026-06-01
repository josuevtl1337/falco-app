import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import type { InstallmentWithStatus, ServiceWithStatus } from "../../types";

interface ServiceChartProps {
    services: ServiceWithStatus[];
    installments?: InstallmentWithStatus[];
}

const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#14b8a6",
    "#eab308",
    "#a855f7",
    "#fb7185",
];

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
            {data.payload?.detail && (
                <p className="text-[11px] text-slate-500 mt-1">{data.payload.detail}</p>
            )}
        </div>
    );
}

export default function ServiceChart({
    services,
    installments = [],
}: ServiceChartProps) {
    const chartData = [
        ...services.map((service) => ({
            name: service.name,
            value: service.monthly_amount,
            detail: "Servicio fijo",
        })),
        ...installments.map((installment) => ({
            name: installment.name,
            value: installment.monthly_amount,
            detail: `Cuota ${installment.installment_number}/${installment.total_months}`,
        })),
    ].filter((item) => item.value > 0);

    if (chartData.length === 0) {
        return (
            <Card className="border-slate-800 bg-slate-950/50">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-200">
                        Distribucion mensual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">$</span>
                        <p className="text-slate-500 text-sm">
                            Configura servicios o cuotas con monto mensual
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
                    Distribucion mensual
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
