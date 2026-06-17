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
  shift: "morning" | "afternoon";
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
      <div className="rounded-lg border border-border/60 bg-background/30 p-8 text-center text-sm text-muted-foreground">
        Cargando historial...
      </div>
    );
  }

  if (shift === "both" || !shift) {
    const morningOrders = orders.filter((order) => order.shift === "morning");
    const afternoonOrders = orders.filter(
      (order) => order.shift === "afternoon",
    );

    return (
      <div className="flex flex-col gap-5">
        <OrdersSection
          title="Turno mañana"
          orders={morningOrders}
          emptyMessage="No hay comandas en el turno mañana."
        />
        <OrdersSection
          title="Turno tarde"
          orders={afternoonOrders}
          emptyMessage="No hay comandas en el turno tarde."
        />
      </div>
    );
  }

  return (
    <OrdersSection
      title={shift === "morning" ? "Turno mañana" : "Turno tarde"}
      orders={orders}
      emptyMessage="No hay comandas en este turno."
    />
  );
}

function OrdersSection({
  title,
  orders,
  emptyMessage,
}: {
  title: string;
  orders: Order[];
  emptyMessage: string;
}) {
  const total = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {orders.length} {orders.length === 1 ? "comanda" : "comandas"}
          </p>
        </div>
        <div className="rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-right">
          <div className="text-[10px] leading-none text-muted-foreground">
            Total turno
          </div>
          <div className="mt-1 text-sm font-semibold leading-none text-foreground">
            ${total.toLocaleString()}
          </div>
        </div>
      </div>

      <OrdersTable orders={orders} emptyMessage={emptyMessage} />
    </section>
  );
}

function OrdersTable({
  orders,
  emptyMessage,
}: {
  orders: Order[];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-background/30">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="text-xs text-muted-foreground">Hora</TableHead>
            <TableHead className="text-xs text-muted-foreground">Mesa</TableHead>
            <TableHead className="text-xs text-muted-foreground">Items</TableHead>
            <TableHead className="text-xs text-muted-foreground">Pago</TableHead>
            <TableHead className="text-right text-xs text-muted-foreground">
              Total
            </TableHead>
            <TableHead className="text-center text-xs text-muted-foreground">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="h-20 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const itemLabel = order.items
                .filter((item) => item.menu_item_name)
                .map((item) => `${item.quantity} ${item.menu_item_name}`)
                .join(", ");

              return (
                <TableRow
                  key={order.id}
                  className="border-border/50 hover:bg-muted/20"
                >
                  <TableCell className="font-medium text-foreground">
                    {order.created_at?.slice(11, 16) || "-"}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted/30 px-2 py-1 text-xs font-medium text-foreground">
                      {order.table_number || "-"}
                    </span>
                  </TableCell>
                  <TableCell
                    className="max-w-[520px] truncate text-muted-foreground"
                    title={itemLabel}
                  >
                    {itemLabel || "Sin items"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.payment_method_name || "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    ${order.total_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "paid"
      ? {
          label: "Pagado",
          className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        }
      : status === "debt"
        ? {
            label: "A cuenta",
            className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
          }
        : status === "cancelled"
          ? {
              label: "Cancelada",
              className: "border-slate-500/40 bg-slate-500/10 text-slate-300",
            }
          : {
              label: status,
              className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
            };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
