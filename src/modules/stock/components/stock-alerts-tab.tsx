import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconAlertTriangle,
  IconPackageOff,
  IconCircleCheck,
  IconFlame,
} from "@tabler/icons-react";
import { useLowStockAlerts } from "../hooks/use-stock";
import type { LowStockAlert } from "../types";

function AlertSeverity({ alert }: { alert: LowStockAlert }) {
  const isOutOfStock = alert.current_stock === 0;
  const isCritical = alert.current_stock <= Math.floor(alert.alert_threshold * 0.5);

  if (isOutOfStock) {
    return (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 gap-1 animate-pulse">
        <IconPackageOff size={12} />
        Sin stock
      </Badge>
    );
  }

  if (isCritical) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 gap-1">
        <IconFlame size={12} />
        Crítico
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 gap-1">
      <IconAlertTriangle size={12} />
      Bajo
    </Badge>
  );
}

function StockAlertsTab() {
  const { alerts, loading } = useLowStockAlerts();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="py-12 text-center">
          <IconCircleCheck size={48} className="mx-auto text-emerald-400 mb-3" />
          <h3 className="text-lg font-semibold text-emerald-400">
            Todo en orden
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            No hay productos con stock bajo. Todos los niveles están por encima del umbral.
          </p>
        </CardContent>
      </Card>
    );
  }

  const outOfStock = alerts.filter((a) => a.current_stock === 0);
  const lowStock = alerts.filter((a) => a.current_stock > 0);

  return (
    <div className="space-y-6">
      {/* Out of stock — aggressive section */}
      {outOfStock.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20">
              <IconPackageOff size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide">
                Productos Agotados
              </h3>
              <p className="text-xs text-muted-foreground">
                {outOfStock.length} {outOfStock.length === 1 ? "producto requiere" : "productos requieren"} reposición inmediata
              </p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500 to-red-400 animate-pulse" />
            <div className="divide-y divide-red-500/10">
              {outOfStock.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-red-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30">
                      <IconPackageOff size={20} className="text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{alert.name}</p>
                      <p className="text-xs text-red-400/80">
                        Umbral: {alert.alert_threshold} uds — requiere reposición
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-400">0</p>
                      <p className="text-[10px] text-muted-foreground">unidades</p>
                    </div>
                    <AlertSeverity alert={alert} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Low stock — warning section */}
      {lowStock.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
              <IconAlertTriangle size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                Stock Bajo
              </h3>
              <p className="text-xs text-muted-foreground">
                {lowStock.length} {lowStock.length === 1 ? "producto está" : "productos están"} por debajo del umbral
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden">
            <div className="divide-y divide-amber-500/10">
              {lowStock
                .sort((a, b) => a.current_stock - b.current_stock)
                .map((alert) => {
                  const percentage = Math.min(
                    (alert.current_stock / Math.max(alert.alert_threshold * 2, 1)) * 100,
                    100
                  );

                  return (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <IconAlertTriangle size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{alert.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {alert.current_stock}/{alert.alert_threshold} umbral
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-400">
                            {alert.current_stock}
                          </p>
                          <p className="text-[10px] text-muted-foreground">unidades</p>
                        </div>
                        <AlertSeverity alert={alert} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockAlertsTab;
