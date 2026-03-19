import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  IconArrowUp,
  IconArrowDown,
  IconClipboardList,
} from "@tabler/icons-react";
import { useStockMovements } from "../hooks/use-stock";
import { formatStockDate } from "../utils/format-date";

interface Props {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StockMovementsDialog({ productId, open, onOpenChange }: Props) {
  const { movements, loading } = useStockMovements(
    open && productId ? productId : undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos</DialogTitle>
          <DialogDescription>
            Registro de todos los cambios de stock para este producto
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="py-8 text-center">
            <IconClipboardList size={36} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay movimientos registrados
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {movements.map((movement) => {
              const isPositive = movement.quantity_change > 0;

              return (
                <div
                  key={movement.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                      isPositive
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {isPositive ? (
                      <IconArrowUp size={16} className="text-emerald-400" />
                    ) : (
                      <IconArrowDown size={16} className="text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs text-muted-foreground truncate">
                        {movement.reason}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {movement.previous_stock} → <span className="font-semibold text-foreground">{movement.new_stock}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatStockDate(movement.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StockMovementsDialog;
