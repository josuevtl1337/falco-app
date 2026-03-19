import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconArrowUp,
  IconArrowDown,
  IconHistory,
  IconClipboardList,
} from "@tabler/icons-react";
import { useStockMovements } from "../hooks/use-stock";
import { formatStockDate } from "../utils/format-date";

function StockHistoryTab() {
  const { movements, loading } = useStockMovements();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <IconClipboardList size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay movimientos registrados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconHistory size={18} className="text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold">Historial de Movimientos</h3>
          <p className="text-xs text-muted-foreground">
            Últimos {movements.length} movimientos de stock
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {movements.map((movement) => {
          const isPositive = movement.quantity_change > 0;

          return (
            <Card
              key={movement.id}
              className="border-border/40 hover:border-border/60 transition-colors"
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {/* Direction icon */}
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                      isPositive
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {isPositive ? (
                      <IconArrowUp size={18} className="text-emerald-400" />
                    ) : (
                      <IconArrowDown size={18} className="text-red-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {movement.stock_product_name}
                      </p>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          isPositive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {movement.quantity_change}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {movement.reason}
                    </p>
                  </div>

                  {/* Stock change */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {movement.previous_stock} → <span className="font-semibold text-foreground">{movement.new_stock}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatStockDate(movement.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default StockHistoryTab;
