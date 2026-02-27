import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProductRanking } from "../hooks/use-advanced-reports";
import {
    IconTrophy,
    IconArrowUp,
    IconArrowDown,
} from "@tabler/icons-react";

interface ProductRankingProps {
    month: number;
    year: number;
}

function getMedalEmoji(index: number): string {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
}

export default function ProductRanking({ month, year }: ProductRankingProps) {
    const [order, setOrder] = useState<"top" | "bottom">("top");

    const { data, loading } = useProductRanking(month, year, order);

    // Totals
    const totalQuantity = data.reduce((acc, p) => acc + p.quantity_sold, 0);
    const totalRevenue = data.reduce((acc, p) => acc + p.revenue, 0);

    return (
        <Card className="border-slate-800 bg-slate-950/50 flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconTrophy size={20} className="text-yellow-400" />
                        <CardTitle className="text-lg text-slate-200">
                            Ranking de Productos
                        </CardTitle>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant={order === "top" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOrder("top")}
                            className={`text-xs ${order === "top"
                                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                                }`}
                        >
                            <IconArrowUp size={14} className="mr-1" />
                            Más vendidos
                        </Button>
                        <Button
                            variant={order === "bottom" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOrder("bottom")}
                            className={`text-xs ${order === "bottom"
                                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                                }`}
                        >
                            <IconArrowDown size={14} className="mr-1" />
                            Menos vendidos
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                {!loading && data.length > 0 && (
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>
                            {data.length} producto{data.length !== 1 ? "s" : ""}
                        </span>
                        <span>
                            {totalQuantity} uds · ${totalRevenue.toLocaleString("es-AR")}
                        </span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 min-h-[300px]">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-12 bg-slate-800/50 rounded-lg animate-pulse"
                            />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <span className="text-4xl text-slate-600">📦</span>
                        <p className="text-slate-500 text-sm text-center">
                            No hay datos de productos para este período
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        {data.map((product, idx) => {
                            const maxQty = Math.max(...data.map((p) => p.quantity_sold), 1);
                            const barWidth = (product.quantity_sold / maxQty) * 100;
                            const medal = getMedalEmoji(idx);

                            return (
                                <div
                                    key={product.menu_item_id}
                                    className="relative flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-all group"
                                >
                                    {/* Progress bar background */}
                                    <div
                                        className="absolute inset-0 rounded-lg opacity-[0.07] transition-all"
                                        style={{
                                            width: `${barWidth}%`,
                                            background:
                                                order === "top"
                                                    ? "linear-gradient(90deg, #3b82f6, #6366f1)"
                                                    : "linear-gradient(90deg, #ef4444, #f97316)",
                                        }}
                                    />

                                    {/* Position */}
                                    <span className="relative text-sm font-bold min-w-[2.5rem] text-center">
                                        {medal ? (
                                            <span className="text-lg">{medal}</span>
                                        ) : (
                                            <span className="text-slate-500 text-xs font-mono">
                                                #{idx + 1}
                                            </span>
                                        )}
                                    </span>

                                    {/* Name */}
                                    <div className="relative flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">
                                            {product.name}
                                        </p>
                                    </div>

                                    {/* Quantity */}
                                    <Badge
                                        variant="outline"
                                        className="relative border-slate-700 text-slate-300 bg-slate-800/50"
                                    >
                                        {product.quantity_sold} uds
                                    </Badge>

                                    {/* Revenue */}
                                    <span className="relative text-sm font-semibold text-slate-200 min-w-[80px] text-right">
                                        ${product.revenue?.toLocaleString() ?? 0}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
