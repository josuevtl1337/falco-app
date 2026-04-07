import useDashboard from "./hooks/use-dashboard";
import KpiCards from "./components/kpi-cards";
import QuickActions from "./components/quick-actions";
import StockAlertsCard from "./components/stock-alerts-card";
import TopProductsCard from "./components/top-products-card";
import RevenueChart from "./components/revenue-chart";
import PaymentBreakdownCard from "./components/payment-breakdown-card";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

function HomePage() {
  const [data, loading, refresh] = useDashboard();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Panel de control — {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-1.5"
        >
          <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* KPI Cards */}
      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <KpiCards
          total={data.today.total}
          count={data.today.count}
          avg={data.today.avg}
          topProduct={data.today.topProduct}
          yesterdayTotal={data.yesterday.total}
        />
      ) : null}

      {/* Main Grid: Chart + Sidebar */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: chart + top products */}
          <div className="lg:col-span-2 space-y-4">
            <RevenueChart data={data.chartData} />
            <TopProductsCard products={data.topProducts} />
          </div>

          {/* Right: payment breakdown + alerts */}
          <div className="space-y-4">
            <PaymentBreakdownCard breakdown={data.today.paymentBreakdown} />
            <StockAlertsCard alerts={data.stockAlerts} />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
