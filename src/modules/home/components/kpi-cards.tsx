import { Card, CardContent } from "@/components/ui/card";
import {
  IconCash,
  IconReceipt,
  IconChartLine,
  IconTrophy,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";

interface KpiCardsProps {
  total: number;
  count: number;
  avg: number;
  topProduct: { name: string; qty: number } | null;
  yesterdayTotal: number;
}

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function KpiCards({
  total,
  count,
  avg,
  topProduct,
  yesterdayTotal,
}: KpiCardsProps) {
  const diff = yesterdayTotal > 0 ? ((total - yesterdayTotal) / yesterdayTotal) * 100 : 0;
  const isUp = diff >= 0;

  const cards = [
    {
      label: "Ventas de hoy",
      value: `$${formatARS(total)}`,
      icon: IconCash,
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/20",
      extra: yesterdayTotal > 0 ? (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? <IconTrendingUp size={14} /> : <IconTrendingDown size={14} />}
          {Math.abs(diff).toFixed(1)}% vs ayer
        </span>
      ) : null,
    },
    {
      label: "Órdenes",
      value: String(count),
      icon: IconReceipt,
      color: "text-purple-400",
      bg: "from-purple-500/10 to-purple-500/5",
      border: "border-purple-500/20",
    },
    {
      label: "Ticket promedio",
      value: `$${formatARS(avg)}`,
      icon: IconChartLine,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20",
    },
    {
      label: "Producto top",
      value: topProduct?.name ?? "—",
      icon: IconTrophy,
      color: "text-amber-400",
      bg: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/20",
      extra: topProduct ? (
        <span className="text-xs text-muted-foreground">
          {topProduct.qty} unidades
        </span>
      ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={`bg-gradient-to-br ${c.bg} ${c.border} hover:scale-[1.02] transition-transform duration-200`}
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {c.label}
              </span>
              <c.icon size={18} className={c.color} />
            </div>
            <div className={`text-2xl font-bold ${c.color} truncate`}>
              {c.value}
            </div>
            {c.extra && <div className="mt-1">{c.extra}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
