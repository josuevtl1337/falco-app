import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconAlertTriangle,
  IconPackage,
  IconPackageOff,
  IconHistory,
  IconRefresh,
  IconBoxSeam,
} from "@tabler/icons-react";
import StockProductsTab from "./components/stock-products-tab";
import StockAlertsTab from "./components/stock-alerts-tab";
import StockHistoryTab from "./components/stock-history-tab";
import { useLowStockAlerts, useStockProducts } from "./hooks/use-stock";

function StockPage() {
  const { alerts, loading: alertsLoading, refetch: refetchAlerts } = useLowStockAlerts();
  const { products, loading: productsLoading, refetch: refetchProducts } = useStockProducts();

  const loading = alertsLoading || productsLoading;

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active).length;
  const outOfStock = products.filter((p) => p.active && p.current_stock === 0).length;
  const totalUnits = products.reduce((sum, p) => sum + p.current_stock, 0);

  function handleRefresh() {
    refetchAlerts();
    refetchProducts();
  }

  const kpis = [
    {
      label: "Productos activos",
      value: `${activeProducts}/${totalProducts}`,
      icon: IconPackage,
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/20",
    },
    {
      label: "Unidades totales",
      value: totalUnits.toLocaleString("es-AR"),
      icon: IconBoxSeam,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20",
    },
    {
      label: "Alertas activas",
      value: String(alerts.length),
      icon: IconAlertTriangle,
      color: alerts.length > 0 ? "text-amber-400" : "text-emerald-400",
      bg: alerts.length > 0
        ? "from-amber-500/10 to-amber-500/5"
        : "from-emerald-500/10 to-emerald-500/5",
      border: alerts.length > 0 ? "border-amber-500/20" : "border-emerald-500/20",
    },
    {
      label: "Sin stock",
      value: String(outOfStock),
      icon: IconPackageOff,
      color: outOfStock > 0 ? "text-red-400" : "text-emerald-400",
      bg: outOfStock > 0
        ? "from-red-500/10 to-red-500/5"
        : "from-emerald-500/10 to-emerald-500/5",
      border: outOfStock > 0 ? "border-red-500/20" : "border-emerald-500/20",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Control de Stock
            </h1>
            {alerts.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-0.5 text-red-400 text-xs font-semibold animate-pulse">
                <IconAlertTriangle size={14} />
                {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestioná productos de stock, mapeos con la carta y alertas de reposición
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-1.5"
        >
          <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className={`bg-gradient-to-br ${kpi.bg} ${kpi.border} hover:scale-[1.02] transition-transform duration-200`}
            >
              <CardContent className="pt-4 pb-3 px-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div className={`text-2xl font-bold ${kpi.color}`}>
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="gap-1.5">
            <IconPackage size={16} />
            Productos
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5">
            <IconAlertTriangle size={16} />
            Alertas
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <IconHistory size={16} />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <StockProductsTab />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <StockAlertsTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <StockHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StockPage;
