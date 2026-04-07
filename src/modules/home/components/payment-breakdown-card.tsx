import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCreditCard } from "@tabler/icons-react";

interface PaymentItem {
  method: string;
  count: number;
  total: number;
}

interface PaymentBreakdownCardProps {
  breakdown: PaymentItem[];
}

const METHOD_CONFIG: Record<string, { label: string; color: string }> = {
  cash: { label: "Efectivo", color: "bg-emerald-400" },
  transfer: { label: "Transferencia", color: "bg-sky-400" },
  other: { label: "Otros", color: "bg-amber-400" },
};

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function PaymentBreakdownCard({
  breakdown,
}: PaymentBreakdownCardProps) {
  const total = useMemo(
    () => breakdown.reduce((s, b) => s + b.total, 0),
    [breakdown]
  );

  if (breakdown.length === 0 || total === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <IconCreditCard size={16} className="text-sky-400" />
          Formas de pago hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {breakdown.map((b) => {
            const pct = (b.total / total) * 100;
            const cfg = METHOD_CONFIG[b.method] || METHOD_CONFIG.other;
            return (
              <div
                key={b.method}
                className={`${cfg.color} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {breakdown.map((b) => {
            const cfg = METHOD_CONFIG[b.method] || METHOD_CONFIG.other;
            const pct = total > 0 ? ((b.total / total) * 100).toFixed(1) : "0";
            return (
              <div key={b.method} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                  <span className="text-muted-foreground">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                  <span className="font-medium">${formatARS(b.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
