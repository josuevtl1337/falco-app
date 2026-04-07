import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChartAreaLine } from "@tabler/icons-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartItem {
  month: string;
  monthNum: number;
  year: number;
  income: number;
  expenses: number;
  profit: number;
}

interface RevenueChartProps {
  data: ChartItem[];
}

function formatARS(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Sin datos históricos disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <IconChartAreaLine size={16} className="text-blue-400" />
          Ingresos últimos meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#74BD5E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#74BD5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(0 0% 60%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatARS}
                tick={{ fontSize: 11, fill: "hsl(0 0% 60%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [
                  `$${value.toLocaleString("es-AR")}`,
                  "Ingresos",
                ]}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#74BD5E"
                strokeWidth={2}
                fill="url(#incomeGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
