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

function StockHistoryTab() {
  const { movements, loading } = useStockMovements();

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">Cargando historial...</div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Historial de Movimientos</h2>
        <p className="text-xs text-muted-foreground mt-1">Últimos 100 movimientos de stock</p>
      </div>

      {movements.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay movimientos registrados
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cambio</TableHead>
              <TableHead>Anterior</TableHead>
              <TableHead>Nuevo</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-xs">{formatStockDate(movement.created_at)}</TableCell>
                <TableCell className="font-medium">{movement.stock_product_name}</TableCell>
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
    </div>
  );
}

export default StockHistoryTab;
