import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface OrderItem {
  menu_item_name: string;
  quantity: number;
}

export interface Order {
  id: number;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  payment_method_name: string;
  items: OrderItem[];
}

interface DailyOrdersTableProps {
  date?: string;
  from?: string;
  to?: string;
  shift?: "morning" | "afternoon" | "both";
  onOrdersLoaded?: (orders: Order[]) => void;
}

export default function DailyOrdersTable({
  date,
  from,
  to,
  shift,
  onOrdersLoaded,
}: DailyOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (date) {
      params.set("date", date);
    } else if (from && to) {
      params.set("from", from);
      params.set("to", to);
    }
    if (shift && shift !== "both") {
      params.set("shift", shift);
    }

    const qs = params.toString();
    const url = `http://localhost:3001/api/get-history${qs ? `?${qs}` : ""}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        onOrdersLoaded?.(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading history:", err);
        setLoading(false);
      });
  }, [date, from, to, shift, onOrdersLoaded]);

  if (loading) {
    return (
      <div className="text-center p-4 text-slate-400">
        Cargando historial...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-4 text-slate-400">
        No hay órdenes para este período.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/50">
      <Table>
        <TableHeader className="bg-slate-900/50">
          <TableRow className="border-slate-800 hover:bg-slate-900/50">
            <TableHead className="text-slate-300">Hora</TableHead>
            <TableHead className="text-slate-300">Mesa</TableHead>
            <TableHead className="text-slate-300">Items</TableHead>
            <TableHead className="text-slate-300">Pago</TableHead>
            <TableHead className="text-right text-slate-300">Total</TableHead>
            <TableHead className="text-center text-slate-300">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="border-slate-800 hover:bg-slate-900/30"
            >
              <TableCell className="font-medium text-slate-300">
                {order.created_at?.slice(11, 16) || "-"}
              </TableCell>
              <TableCell className="text-slate-400">
                {order.table_number || "-"}
              </TableCell>
              <TableCell
                className="text-slate-400 max-w-[200px] truncate"
                title={order.items
                  .map((i) => `${i.quantity} ${i.menu_item_name}`)
                  .join(", ")}
              >
                {order.items
                  .map((i) => `${i.quantity} ${i.menu_item_name}`)
                  .join(", ")}
              </TableCell>
              <TableCell className="text-slate-400">
                {order.payment_method_name || "-"}
              </TableCell>
              <TableCell className="text-right font-medium text-slate-200">
                ${order.total_amount?.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="outline"
                  className={
                    order.status === "paid"
                      ? "border-green-500/50 text-green-400 bg-green-500/10"
                      : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                  }
                >
                  {order.status === "paid" ? "Pagado" : order.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
