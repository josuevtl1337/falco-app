import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
          <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay movimientos registrados
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cambio</TableHead>
                <TableHead>Stock Anterior</TableHead>
                <TableHead>Stock Nuevo</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-xs">{formatStockDate(movement.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={movement.quantity_change > 0 ? "default" : "destructive"}>
                      {movement.quantity_change > 0 ? "+" : ""}
                      {movement.quantity_change}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.previous_stock}</TableCell>
                  <TableCell>{movement.new_stock}</TableCell>
                  <TableCell className="text-sm">{movement.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StockMovementsDialog;
