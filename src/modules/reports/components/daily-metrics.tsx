import { useCallback, useMemo, useRef, useState } from "react";
import useReports, {
  getLocalDateString,
  getMonthRange,
  getWeekRange,
} from "../hooks/use-reports";
import type { PaymentBreakdownItem } from "../hooks/use-reports";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DailyOrdersTable from "./daily-orders-table";
import type { Order } from "./daily-orders-table";
import { IconDownload } from "@tabler/icons-react";
import { toast } from "sonner";

export default function DailyMetrics() {
  const [shift, setShift] = useState<"morning" | "afternoon" | "both">("both");
  const [timeFilter, setTimeFilter] = useState<string>("today");
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);
  const ordersRef = useRef<Order[]>([]);

  const [data] = useReports(timeFilter, shift);

  // Compute date/range props for the orders table
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

  // Payment breakdown helpers
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
      grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : "0.0";

    const cash = findMethod("cash");
    const transfer = findMethod("transfer");
    const other = findMethod("other");

    return {
      cash: { ...cash, pct: pct(cash.total) },
      transfer: { ...transfer, pct: pct(transfer.total) },
      other: { ...other, pct: pct(other.total) },
    };
  }, [data?.paymentBreakdown]);

  const handleOrdersLoaded = useCallback((orders: Order[]) => {
    ordersRef.current = orders;
  }, []);

  // CSV export
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
          o.items.map((i) => `${i.quantity} ${i.menu_item_name}`).join(", "),
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

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-sm text-slate-400 mt-1">
          Visualiza tus métricas de desempeño
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-slate-800 bg-slate-950/50 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
          {/* Turnos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Turno</label>
            <ToggleGroup
              type="single"
              value={shift}
              onValueChange={(value) => value && setShift(value as any)}
              className="justify-start"
            >
              <ToggleGroupItem value="morning" className="rounded-lg border">
                <span className="text-sm">Mañana</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="afternoon" className="rounded-lg border">
                <span className="text-sm">Tarde</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="both" className="rounded-lg border">
                <span className="text-sm">Ambos</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Período de tiempo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Período
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(
                [
                  ["today", "Hoy"],
                  ["yesterday", "Ayer"],
                  ["week", "Esta semana"],
                  ["month", "Este mes"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={timeFilter === value ? "default" : "outline"}
                  className={`rounded-lg text-xs md:text-sm font-medium transition-all`}
                  onClick={() => setTimeFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total vendido */}
        <Card className="border-slate-800 bg-gradient-to-br from-blue-950/50 to-slate-950/50 hover:border-blue-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              $
              {data?.total?.toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }) ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">{periodLabel}</p>
          </CardContent>
        </Card>

        {/* Órdenes */}
        <Card className="border-slate-800 bg-gradient-to-br from-purple-950/50 to-slate-950/50 hover:border-purple-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {data?.count?.toLocaleString?.() ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transacciones completadas
            </p>
          </CardContent>
        </Card>

        {/* Promedio por ticket */}
        <Card className="border-slate-800 bg-gradient-to-br from-green-950/50 to-slate-950/50 hover:border-green-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Promedio / Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              $
              {data?.avg?.toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }) ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Por cada transacción</p>
          </CardContent>
        </Card>

        {/* Producto Top */}
        <Card className="border-slate-800 bg-gradient-to-br from-orange-950/50 to-slate-950/50 hover:border-orange-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Producto Top
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400 truncate">
              {data?.topProduct?.name ?? "N/A"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data?.topProduct?.qty
                ? `${data.topProduct.qty} unidades vendidas`
                : "Sin datos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <div className="px-2">
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 hover:bg-slate-800 text-slate-300"
          onClick={() => setShowPaymentBreakdown((v) => !v)}
        >
          {showPaymentBreakdown ? "Ocultar" : "Formas de Pago"}
        </Button>
      </div>
      {showPaymentBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-800 bg-gradient-to-br from-emerald-950/50 to-slate-950/50 hover:border-emerald-700/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Efectivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                $
                {paymentData.cash.total.toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">
                  {paymentData.cash.count} orden
                  {paymentData.cash.count !== 1 ? "es" : ""}
                </span>
                <span className="text-xs font-medium text-emerald-400/80">
                  {paymentData.cash.pct}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-gradient-to-br from-sky-950/50 to-slate-950/50 hover:border-sky-700/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Transferencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-400">
                $
                {paymentData.transfer.total.toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">
                  {paymentData.transfer.count} orden
                  {paymentData.transfer.count !== 1 ? "es" : ""}
                </span>
                <span className="text-xs font-medium text-sky-400/80">
                  {paymentData.transfer.pct}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-gradient-to-br from-amber-950/50 to-slate-950/50 hover:border-amber-700/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">
                Otros (Tarjetas, QR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                $
                {paymentData.other.total.toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">
                  {paymentData.other.count} orden
                  {paymentData.other.count !== 1 ? "es" : ""}
                </span>
                <span className="text-xs font-medium text-amber-400/80">
                  {paymentData.other.pct}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detalles */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detalles</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
            onClick={handleExportCSV}
          >
            <IconDownload className="w-4 h-4 mr-1" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
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
