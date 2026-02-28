import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useLowStockAlerts } from "../hooks/use-stock";

function StockAlertsTab() {
  const { alerts, loading } = useLowStockAlerts();

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Cargando alertas...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-medium text-[var(--primary-text)]">
          Todo en orden
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          No hay productos con stock bajo
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className="text-xl font-semibold">
          Alertas de Stock Bajo ({alerts.length})
        </h2>
      </div>

      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 mb-4">
        <p className="text-sm text-destructive">
          Los siguientes productos tienen stock igual o por debajo de su umbral
          de alerta configurado. Reponé stock desde la pestaña "Productos".
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Stock Actual</TableHead>
            <TableHead>Umbral de Alerta</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} className="bg-destructive/10">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {alert.name}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-destructive font-bold">
                  {alert.current_stock}
                </span>
              </TableCell>
              <TableCell>{alert.alert_threshold}</TableCell>
              <TableCell>
                <Badge variant="destructive">
                  {alert.current_stock === 0
                    ? "Sin stock"
                    : "Stock bajo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default StockAlertsTab;
