import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import StockProductsTab from "./components/stock-products-tab";
import StockAlertsTab from "./components/stock-alerts-tab";
import StockHistoryTab from "./components/stock-history-tab";
import { useLowStockAlerts } from "./hooks/use-stock";

function StockPage() {
  const { alerts } = useLowStockAlerts();
  const hasAlerts = alerts.length > 0;

  return (
    <main className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--primary-text)]">
            Control de Stock
          </h1>
          {hasAlerts && (
            <span className="flex items-center gap-1.5 rounded-md bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-red-400 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Gestioná productos de stock, mapeos con la carta y alertas de
          reposición
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1.5">
            Alertas
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
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
    </main>
  );
}

export default StockPage;
