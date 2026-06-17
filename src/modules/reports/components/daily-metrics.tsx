import { useCallback, useMemo, useRef, useState } from "react";
import useReports, {
  getLocalDateString,
  getMonthRange,
  getWeekRange,
} from "../hooks/use-reports";
import type { PaymentBreakdownItem } from "../hooks/use-reports";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DailyOrdersTable from "./daily-orders-table";
import type { Order } from "./daily-orders-table";
import {
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCreditCard,
  IconDownload,
  IconFilter,
  IconReceipt2,
  IconStar,
  IconTrendingUp,
} from "@tabler/icons-react";
import { toast } from "sonner";

const PERIOD_OPTIONS = [
  ["today", "Hoy"],
  ["yesterday", "Ayer"],
  ["week", "Semana"],
  ["month", "Mes"],
] as const;

const SHIFT_OPTIONS = [
  ["both", "Todos"],
  ["morning", "Mañana"],
  ["afternoon", "Tarde"],
] as const;

function formatMoney(value = 0) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function DailyMetrics() {
  const [shift, setShift] = useState<"morning" | "afternoon" | "both">("both");
  const [timeFilter, setTimeFilter] = useState("today");
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);
  const ordersRef = useRef<Order[]>([]);

  const [data] = useReports(timeFilter, shift);

  const tableFilters = useMemo(() => {
    switch (timeFilter) {
      case "yesterday":
        return { date: getLocalDateString(-1) };
      case "week":
        return getWeekRange();
      case "month":
        return getMonthRange();
      case "today":
      default:
        return { date: getLocalDateString(0) };
    }
  }, [timeFilter]);

  const paymentData = useMemo(() => {
    const breakdown = data?.paymentBreakdown || [];
    const grandTotal = breakdown.reduce((sum, b) => sum + b.total, 0);

    const findMethod = (method: string): PaymentBreakdownItem =>
      breakdown.find((b) => b.method === method) || {
        method: method as PaymentBreakdownItem["method"],
        count: 0,
        total: 0,
      };

    const pct = (val: number) =>
      grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0;

    const cash = findMethod("cash");
    const transfer = findMethod("transfer");
    const other = findMethod("other");

    return {
      cash: { ...cash, pct: pct(cash.total), label: "Efectivo" },
      transfer: { ...transfer, pct: pct(transfer.total), label: "Transferencia" },
      other: { ...other, pct: pct(other.total), label: "Tarjeta / QR" },
    };
  }, [data?.paymentBreakdown]);

  const handleOrdersLoaded = useCallback((orders: Order[]) => {
    ordersRef.current = orders;
  }, []);

  const handleExportCSV = useCallback(() => {
    const orders = ordersRef.current;
    if (!orders.length) {
      toast.warning("No hay órdenes para exportar en este período");
      return;
    }

    try {
      const escapeCsvField = (value: string | number): string => {
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = [
        "ID",
        "Hora",
        "Mesa",
        "Items",
        "Pago",
        "Total",
        "Estado",
      ];
      const rows = orders.map((o) => [
        o.id,
        o.created_at?.slice(11, 16) || "-",
        escapeCsvField(o.table_number || "-"),
        escapeCsvField(
          o.items
            .filter((i) => i.menu_item_name)
            .map((i) => `${i.quantity} ${i.menu_item_name}`)
            .join(", ") || "Sin items",
        ),
        escapeCsvField(o.payment_method_name || "-"),
        o.total_amount,
        o.status === "paid" ? "Pagado" : o.status,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n",
      );
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resumen-${timeFilter}-${getLocalDateString(0)}.csv`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`CSV exportado (${orders.length} órdenes)`);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toast.error("Error al exportar el archivo CSV");
    }
  }, [timeFilter]);

  const periodLabel = useMemo(() => {
    switch (timeFilter) {
      case "yesterday":
        return "Ayer";
      case "week":
        return "Esta semana";
      case "month":
        return "Este mes";
      default:
        return "Hoy";
    }
  }, [timeFilter]);

  const shiftLabel = useMemo(() => {
    switch (shift) {
      case "morning":
        return "Mañana";
      case "afternoon":
        return "Tarde";
      default:
        return "Todos";
    }
  }, [shift]);

  const metricCards = [
    {
      label: "Total vendido",
      value: formatMoney(data?.total || 0),
      note: periodLabel,
      icon: IconTrendingUp,
    },
    {
      label: "Comandas",
      value: String(data?.count || 0),
      note: "registradas",
      icon: IconReceipt2,
    },
    {
      label: "Ticket promedio",
      value: formatMoney(data?.avg || 0),
      note: "por comanda",
      icon: IconCreditCard,
    },
    {
      label: "Producto top",
      value: data?.topProduct?.name ?? "Sin datos",
      note: data?.topProduct?.qty
        ? `${data.topProduct.qty} unidades`
        : "sin ventas",
      icon: IconStar,
    },
  ];

  return (
    <div className="w-full">
      <Card className="rounded-lg border-border/60 bg-card/70 py-0 shadow-none">
        <CardHeader className="border-b border-border/60 px-5 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg text-foreground">
                Comandas
              </CardTitle>
              <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1 text-xs text-muted-foreground">
                {periodLabel} · {shiftLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Historial filtrado por período y turno
            </p>
          </div>

          <CardAction className="flex flex-wrap items-center justify-end gap-2 max-md:col-start-1 max-md:row-start-2 max-md:justify-self-start">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-1">
              <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
                <IconFilter />
                Filtro
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger
                  size="sm"
                  className="h-8 min-w-[116px] border-border/70 bg-card/70 text-xs"
                >
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PERIOD_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={shift}
                onValueChange={(value) =>
                  setShift(value as "morning" | "afternoon" | "both")
                }
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 min-w-[112px] border-border/70 bg-card/70 text-xs"
                >
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SHIFT_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-border/70 text-xs"
              onClick={() => setShowPaymentBreakdown((value) => !value)}
            >
              <IconCreditCard data-icon="inline-start" />
              Formas de pago
              {showPaymentBreakdown ? (
                <IconChevronUp data-icon="inline-end" />
              ) : (
                <IconChevronDown data-icon="inline-end" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border/70 text-xs"
              onClick={handleExportCSV}
            >
              <IconDownload data-icon="inline-start" />
              CSV
            </Button>
          </CardAction>

          <div className="col-span-full mt-3 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/50 bg-background/30 px-3 py-2">
            {metricCards.map((metric) => {
              const MetricIcon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className="flex min-w-[132px] items-center gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-muted/30 text-muted-foreground">
                    <MetricIcon />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] leading-none text-muted-foreground">
                      {metric.label}
                    </div>
                    <div className="mt-1 max-w-[150px] truncate text-sm font-semibold leading-none text-foreground">
                      {metric.value}
                    </div>
                    <div className="mt-1 text-[10px] leading-none text-muted-foreground">
                      {metric.note}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardHeader>

        {showPaymentBreakdown && (
          <div className="grid gap-2 border-b border-border/60 px-5 py-3 md:grid-cols-3">
            {[paymentData.cash, paymentData.transfer, paymentData.other].map(
              (item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <IconClock className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} comandas · {item.pct}%
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatMoney(item.total)}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <CardContent className="px-5 py-4">
          <DailyOrdersTable
            date={"date" in tableFilters ? tableFilters.date : undefined}
            from={"from" in tableFilters ? tableFilters.from : undefined}
            to={"to" in tableFilters ? tableFilters.to : undefined}
            shift={shift}
            onOrdersLoaded={handleOrdersLoaded}
          />
        </CardContent>
      </Card>
    </div>
  );
}
