import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AreaChart,
  Area,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Coffee,
  LogOut,
  Package,
  RefreshCw,
  ReceiptText,
  Satellite,
  Store,
  WalletCards,
} from "lucide-react";
import { supabase, configured } from "./lib/supabase";
import { useDashboard } from "./hooks/use-dashboard";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  Skeleton,
  Table,
} from "./components/ui";
const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const rangeLabel = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});
function toInputDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function currentMonthRange() {
  const today = new Date();
  return {
    from: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  };
}
function todayRange() {
  const today = toInputDate(new Date());
  return { from: today, to: today };
}
function dateKey(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
function isInsideRange(
  value: string | null | undefined,
  from: string,
  to: string,
) {
  const key = dateKey(value);
  if (!key) return false;
  return (!from || key >= from) && (!to || key <= to);
}
function formatRange(from: string, to: string) {
  if (!from && !to) return "Todo el histórico";
  const start = from
    ? rangeLabel.format(new Date(`${from}T12:00:00`))
    : "inicio";
  const end = to ? rangeLabel.format(new Date(`${to}T12:00:00`)) : "hoy";
  if (from && to && from === to) return start;
  return `${start} → ${end}`;
}
function formatQuantity(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
type Page =
  | "resumen"
  | "ventas"
  | "finanzas"
  | "caja"
  | "stock"
  | "catalogo"
  | "sync";
const nav: [Page, string, typeof BarChart3][] = [
  ["resumen", "Resumen", BarChart3],
  ["ventas", "Ventas", ReceiptText],
  ["finanzas", "Finanzas", WalletCards],
  ["caja", "Caja", Store],
  ["stock", "Stock", Package],
  ["catalogo", "Catálogo", BookOpen],
  ["sync", "Sincronización", Satellite],
];
function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setError(error?.message ?? "");
    setBusy(false);
  }
  return (
    <main className="login">
      <section className="login__brand">
        <div className="mark">
          <Coffee />
        </div>
        <p>FALCO · OFICINA</p>
        <h1>
          El local,
          <br />
          <em>a la vista.</em>
        </h1>
        <p className="login__copy">
          Ventas, caja y stock reunidos en una lectura tranquila del negocio.
        </p>
      </section>
      <Card className="login__card">
        <CardHeader>
          <CardTitle>Entrar al dashboard</CardTitle>
          <CardDescription>Acceso privado para administración.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            {!configured && (
              <p className="form__error">
                Configurá las variables VITE_SUPABASE_*.
              </p>
            )}
            {error && <p className="form__error">{error}</p>}
            <Button disabled={busy || !configured}>
              {busy ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
function App() {
  const [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { subscriber } = {
      subscriber: supabase.auth.onAuthStateChange((_e, s) => setSession(s)).data
        .subscription,
    };
    return () => subscriber.unsubscribe();
  }, []);
  if (!ready) return <div className="boot">FALCO</div>;
  return session ? <Dashboard /> : <Login />;
}
function Dashboard() {
  const [page, setPage] = useState<Page>("resumen");
  const [range, setRange] = useState(todayRange);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const d = useDashboard();
  const filteredOrders = useMemo(
    () =>
      d.orders.filter((o) =>
        isInsideRange(o.source_created_at, range.from, range.to),
      ),
    [d.orders, range.from, range.to],
  );
  const filteredExpenses = useMemo(
    () =>
      d.expenses.filter((e) =>
        isInsideRange(e.expense_date, range.from, range.to),
      ),
    [d.expenses, range.from, range.to],
  );
  const filteredShifts = useMemo(
    () =>
      d.shifts.filter((s) =>
        isInsideRange(s.shift_date, range.from, range.to),
      ),
    [d.shifts, range.from, range.to],
  );
  const paid = filteredOrders.filter((o) => o.status === "paid"),
    revenue = paid.reduce((s, o) => s + Number(o.total_amount), 0),
    expenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0),
    low = d.stock.filter(
      (s) => s.active && Number(s.current_stock) <= Number(s.alert_threshold),
    );
  const chart = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of paid) {
      const k = (o.source_created_at ?? "").slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + Number(o.total_amount));
    }
    return [...map]
      .sort()
      .map(([day, total]) => ({ day: day.slice(5), total }));
  }, [paid]);
  const resetToday = () => setRange(todayRange());
  const resetMonth = () => setRange(currentMonthRange());
  const selectDay = (day: string) => setRange({ from: day, to: day });
  const showAll = () => setRange({ from: "", to: "" });
  return (
    <div className="shell">
      <aside>
        <div className="aside__brand">
          <div className="mark">
            <Coffee />
          </div>
          <div>
            <strong>Falco</strong>
            <span>Oficina</span>
          </div>
        </div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="aside__foot">
          <span>SOLO LECTURA</span>
          <button onClick={() => void supabase.auth.signOut()}>
            <LogOut />
            Salir
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">FALCO · LOCAL PRINCIPAL</span>
            <h1>{nav.find((n) => n[0] === page)?.[1]}</h1>
          </div>
          <Button className="button--ghost" onClick={() => void d.reload()}>
            <RefreshCw />
            Actualizar
          </Button>
        </header>
        <section className="period-panel" aria-label="Filtro de período">
          <div className="period-panel__title">
            <CalendarDays />
            <div>
              <span>Período de lectura</span>
              <strong>{formatRange(range.from, range.to)}</strong>
            </div>
          </div>
          <div className="period-panel__controls">
            <label className="period-panel__day">
              Día
              <input
                type="date"
                value={range.from === range.to ? range.from : ""}
                onChange={(event) => selectDay(event.target.value)}
              />
            </label>
            <Button
              className="button--ghost period-panel__primary"
              onClick={resetToday}
            >
              Hoy
            </Button>
            <Button
              className="button--ghost"
              onClick={() => setAdvancedFiltersOpen((open) => !open)}
              aria-expanded={advancedFiltersOpen}
              aria-controls="advanced-period-filters"
            >
              {advancedFiltersOpen ? "Ocultar filtros" : "Más filtros"}
            </Button>
          </div>
          {advancedFiltersOpen && (
            <div
              className="period-panel__advanced"
              id="advanced-period-filters"
            >
              <label>
                Desde
                <input
                  type="date"
                  value={range.from}
                  onChange={(event) =>
                    setRange((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={range.to}
                  onChange={(event) =>
                    setRange((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                />
              </label>
              <Button className="button--ghost" onClick={resetMonth}>
                Este mes
              </Button>
              <Button className="button--ghost" onClick={showAll}>
                Todo
              </Button>
            </div>
          )}
        </section>
        {d.error && (
          <div className="alert">
            No pudimos actualizar los datos: {d.error}
          </div>
        )}
        {d.loading ? (
          <Loading />
        ) : (
          <>
            {page === "resumen" && (
              <SummaryFiltered
                revenue={revenue}
                expenses={expenses}
                orders={paid.length}
                low={low.length}
                chart={chart}
                rangeText={formatRange(range.from, range.to)}
              />
            )}{" "}
            {page === "ventas" && <Sales orders={filteredOrders} />}{" "}
            {page === "finanzas" && (
              <FinanceAdmin
                orders={filteredOrders}
                allOrders={d.orders}
                orderItems={d.orderItems}
                expenses={filteredExpenses}
                allExpenses={d.expenses}
                products={d.products}
                services={d.services}
                servicePayments={d.servicePayments}
                expenseRequests={d.expenseRequests}
                rangeText={formatRange(range.from, range.to)}
                range={range}
                onCreateExpense={d.createExpenseRequest}
              />
            )}{" "}
            {page === "caja" && (
              <Cash shifts={filteredShifts} vitrineItems={d.vitrineItems} />
            )}{" "}
            {page === "stock" && (
              <Stock
                data={d.stock}
                stockAdjustmentRequests={d.stockAdjustmentRequests}
                onCreateStockAdjustment={d.createStockAdjustmentRequest}
              />
            )}{" "}
            {page === "catalogo" && <Catalog products={d.products} />}{" "}
            {page === "sync" && <Sync devices={d.devices} />}
          </>
        )}
      </main>
    </div>
  );
}
function Loading() {
  return (
    <div className="grid">
      <Skeleton />
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="metric">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <span>{note}</span>
      </CardContent>
    </Card>
  );
}
function SummaryFiltered({
  revenue,
  expenses,
  orders,
  low,
  chart,
  rangeText,
}: {
  revenue: number;
  expenses: number;
  orders: number;
  low: number;
  chart: { day: string; total: number }[];
  rangeText: string;
}) {
  return (
    <>
      <div className="metrics">
        <Metric
          label="Ventas cobradas"
          value={money.format(revenue)}
          note={rangeText}
        />
        <Metric label="Gastos" value={money.format(expenses)} note={rangeText} />
        <Metric
          label="Resultado simple"
          value={money.format(revenue - expenses)}
          note="ventas menos gastos"
        />
        <Metric
          label="Alertas de stock"
          value={String(low)}
          note={low ? "requieren atención" : "todo en orden"}
        />
      </div>
      <Card className="chart-card">
        <CardHeader>
          <div>
            <CardDescription>RITMO DE VENTAS</CardDescription>
            <CardTitle>Ventas del período</CardTitle>
          </div>
          <Badge variant="outline">{orders} operaciones</Badge>
        </CardHeader>
        <CardContent>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0"
                      stopColor="var(--accent)"
                      stopOpacity={0.32}
                    />
                    <stop
                      offset="1"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => money.format(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Todavía sin ventas"
              description="No hay ventas cobradas dentro del período elegido."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
function Summary({
  revenue,
  expenses,
  orders,
  low,
  chart,
}: {
  revenue: number;
  expenses: number;
  orders: number;
  low: number;
  chart: { day: string; total: number }[];
}) {
  return (
    <>
      <div className="metrics">
        <Metric
          label="Ventas cobradas"
          value={money.format(revenue)}
          note="histórico sincronizado"
        />
        <Metric
          label="Gastos"
          value={money.format(expenses)}
          note="carga operativa"
        />
        <Metric
          label="Resultado simple"
          value={money.format(revenue - expenses)}
          note="ventas menos gastos"
        />
        <Metric
          label="Alertas de stock"
          value={String(low)}
          note={low ? "requieren atención" : "todo en orden"}
        />
      </div>
      <Card className="chart-card">
        <CardHeader>
          <div>
            <CardDescription>RITMO DE VENTAS</CardDescription>
            <CardTitle>Últimos días registrados</CardTitle>
          </div>
          <Badge variant="outline">{orders} operaciones</Badge>
        </CardHeader>
        <CardContent>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0"
                      stopColor="var(--accent)"
                      stopOpacity={0.32}
                    />
                    <stop
                      offset="1"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => money.format(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Todavía sin ventas"
              description="El gráfico aparecerá después de la primera sincronización."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
function Sales({
  orders,
}: {
  orders: ReturnType<typeof useDashboard>["orders"];
}) {
  return (
    <DataCard
      title="Registro de ventas"
      description={`${orders.length} órdenes sincronizadas`}
      headers={["Fecha", "Turno", "Estado", "Total"]}
      rows={orders.map((o) => [
        o.source_created_at ? date.format(new Date(o.source_created_at)) : "—",
        o.shift || "—",
        <Badge variant={o.status === "paid" ? "default" : "secondary"}>
          {o.status}
        </Badge>,
        money.format(o.total_amount),
      ])}
    />
  );
}
function productRanking(
  orderItems: ReturnType<typeof useDashboard>["orderItems"],
  paidOrderIds: Set<number>,
  productById: Map<number, ReturnType<typeof useDashboard>["products"][number]>,
) {
  const totals = new Map<
    number,
    { id: number; name: string; quantity: number; total: number }
  >();
  for (const item of orderItems) {
    if (!paidOrderIds.has(item.order_id)) continue;
    const product = productById.get(item.menu_item_id);
    const current = totals.get(item.menu_item_id) ?? {
      id: item.menu_item_id,
      name: product?.name ?? `Producto ${item.menu_item_id}`,
      quantity: 0,
      total: 0,
    };
    current.quantity += Number(item.quantity);
    current.total += Number(item.subtotal);
    totals.set(item.menu_item_id, current);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total);
}
function monthKeyFromDate(value: string) {
  return value.slice(0, 7);
}
function buildMonthlyFinanceChart(
  orders: ReturnType<typeof useDashboard>["orders"],
  expenses: ReturnType<typeof useDashboard>["expenses"],
) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const dateValue = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = toInputDate(dateValue).slice(0, 7);
    return {
      key,
      label: rangeLabel.format(dateValue).replace(".", ""),
      ingresos: 0,
      gastos: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const order of orders) {
    if (order.status !== "paid") continue;
    const bucket = byKey.get(monthKeyFromDate(order.source_created_at));
    if (bucket) bucket.ingresos += Number(order.total_amount);
  }
  for (const expense of expenses) {
    const bucket = byKey.get(monthKeyFromDate(expense.expense_date));
    if (bucket) bucket.gastos += Number(expense.amount);
  }
  return months;
}
function FinanceMetric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "income" | "expense" | "profit" | "margin";
}) {
  return (
    <Card className={`finance-metric finance-metric--${tone}`}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <span>{note}</span>
      </CardContent>
    </Card>
  );
}
function ExpenseTable({
  expenses,
  requests,
  onCreateExpense,
}: {
  expenses: ReturnType<typeof useDashboard>["expenses"];
  requests: ReturnType<typeof useDashboard>["expenseRequests"];
  onCreateExpense: ReturnType<typeof useDashboard>["createExpenseRequest"];
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<
    "servicios" | "proveedores" | "supermercado" | "otros"
  >("proveedores");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(toInputDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Ingres? un importe mayor a cero");
      }
      await onCreateExpense({
        amount: parsedAmount,
        category,
        description,
        expense_date: expenseDate,
      });
      setAmount("");
      setDescription("");
      setMessage("Gasto enviado a la notebook para aplicar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="admin-write-stack">
      <Card className="write-card">
        <CardHeader>
          <div>
            <CardTitle>Cargar gasto</CardTitle>
            <CardDescription>
              Se guarda como solicitud y la notebook lo aplica en SQLite.
            </CardDescription>
          </div>
          <Badge variant="outline">ESCRITURA CONTROLADA</Badge>
        </CardHeader>
        <CardContent>
          <form className="write-form" onSubmit={submit}>
            <label>
              Fecha
              <input
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                required
              />
            </label>
            <label>
              Categor?a
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as typeof category)
                }
              >
                <option value="proveedores">Proveedores</option>
                <option value="supermercado">Supermercado</option>
                <option value="servicios">Servicios</option>
                <option value="otros">Otros</option>
              </select>
            </label>
            <label>
              Importe
              <input
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>
            <label className="write-form__wide">
              Descripci?n
              <input
                placeholder="Detalle visible en reportes"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <Button disabled={saving} type="submit">
              {saving ? "Enviando..." : "Enviar gasto"}
            </Button>
          </form>
          {message && <p className="write-message">{message}</p>}
        </CardContent>
      </Card>
      <DataCard
        title="Gastos"
        description={expenses.length + " movimientos aplicados"}
        headers={["Fecha", "Categor?a", "Descripci?n", "Importe"]}
        rows={expenses.map((expense) => [
          expense.expense_date
            ? date.format(new Date(expense.expense_date + "T12:00:00"))
            : "?",
          expense.category,
          expense.description || "Sin detalle",
          money.format(expense.amount),
        ])}
      />
      <RequestHistory
        title="Solicitudes recientes"
        rows={requests.slice(0, 8).map((request) => [
          request.created_at ? date.format(new Date(request.created_at)) : "?",
          money.format(request.amount),
          request.description || request.category,
          <RequestStatusBadge
            status={request.status}
            error={request.error_message}
          />,
        ])}
      />
    </div>
  );
}
function FinanceAdmin({
  orders,
  allOrders,
  orderItems,
  expenses,
  allExpenses,
  products,
  services,
  servicePayments,
  expenseRequests,
  rangeText,
  range,
  onCreateExpense,
}: {
  orders: ReturnType<typeof useDashboard>["orders"];
  allOrders: ReturnType<typeof useDashboard>["orders"];
  orderItems: ReturnType<typeof useDashboard>["orderItems"];
  expenses: ReturnType<typeof useDashboard>["expenses"];
  allExpenses: ReturnType<typeof useDashboard>["expenses"];
  products: ReturnType<typeof useDashboard>["products"];
  services: ReturnType<typeof useDashboard>["services"];
  servicePayments: ReturnType<typeof useDashboard>["servicePayments"];
  expenseRequests: ReturnType<typeof useDashboard>["expenseRequests"];
  rangeText: string;
  range: { from: string; to: string };
  onCreateExpense: ReturnType<typeof useDashboard>["createExpenseRequest"];
}) {
  const [tab, setTab] = useState<"reports" | "expenses" | "services">(
    "reports",
  );
  const paidOrders = orders.filter((order) => order.status === "paid");
  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0,
  );
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );
  const net = revenue - totalExpenses;
  const margin = revenue ? (net / revenue) * 100 : 0;
  const paidOrderIds = new Set(paidOrders.map((order) => order.local_id));
  const productById = new Map(
    products.map((product) => [product.local_id, product]),
  );
  const ranking = productRanking(orderItems, paidOrderIds, productById).slice(
    0,
    8,
  );
  const monthlyChart = buildMonthlyFinanceChart(allOrders, allExpenses);
  const paidServicePayments = servicePayments.filter((payment) =>
    isInsideRange(payment.payment_date, range.from, range.to),
  );
  const servicePaymentsByService = new Map(
    paidServicePayments.map((payment) => [payment.service_id, payment]),
  );
  return (
    <div className="finance-stack">
      <div className="finance-tabs" role="tablist" aria-label="Finanzas">
        <button
          className={tab === "reports" ? "active" : ""}
          onClick={() => setTab("reports")}
        >
          Reportes
        </button>
        <button
          className={tab === "expenses" ? "active" : ""}
          onClick={() => setTab("expenses")}
        >
          Gastos
        </button>
        <button
          className={tab === "services" ? "active" : ""}
          onClick={() => setTab("services")}
        >
          Servicios <span>{services.filter((service) => service.active).length}</span>
        </button>
      </div>

      {tab === "reports" && (
        <>
          <div className="finance-period">
            <strong>{rangeText}</strong>
            <span>lectura administrativa</span>
          </div>
          <div className="finance-metrics">
            <FinanceMetric
              label="Total ingresado"
              value={money.format(revenue)}
              note={`${paidOrders.length} órdenes cobradas`}
              tone="income"
            />
            <FinanceMetric
              label="Total gastado"
              value={money.format(totalExpenses)}
              note={`${expenses.length} movimientos`}
              tone="expense"
            />
            <FinanceMetric
              label="Ganancia neta"
              value={money.format(net)}
              note={net >= 0 ? "balance positivo" : "balance negativo"}
              tone={net >= 0 ? "profit" : "expense"}
            />
            <FinanceMetric
              label="Margen"
              value={`${margin.toFixed(1)}%`}
              note="sobre ingresos cobrados"
              tone="margin"
            />
          </div>
          <div className="finance-report-grid">
            <Card className="finance-chart-card">
              <CardHeader>
                <div>
                  <CardTitle>Ingresos vs Gastos</CardTitle>
                  <CardDescription>Últimos 12 meses</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={310}>
                  <RechartsBarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => money.format(Number(value))} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#3f7ee8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gastos" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="finance-ranking-card">
              <CardHeader>
                <div>
                  <CardTitle>Ranking de productos</CardTitle>
                  <CardDescription>
                    {ranking.length} productos vendidos en el período
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {ranking.length ? (
                  <div className="ranking-list">
                    {ranking.map((item, index) => (
                      <div className="ranking-row" key={item.id}>
                        <span>#{index + 1}</span>
                        <strong>{item.name}</strong>
                        <em>{formatQuantity(item.quantity)} uds</em>
                        <b>{money.format(item.total)}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Sin ventas de productos"
                    description="El ranking aparece cuando hay órdenes cobradas en el período."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {tab === "expenses" && (
        <ExpenseTable
          expenses={expenses}
          requests={expenseRequests}
          onCreateExpense={onCreateExpense}
        />
      )}

      {tab === "services" && (
        <DataCard
          title="Servicios"
          description="Servicios fijos y pagos registrados dentro del período"
          headers={["Servicio", "Vence", "Esperado", "Pagado", "Estado"]}
          rows={services
            .filter((service) => service.active)
            .map((service) => {
              const payment = servicePaymentsByService.get(service.local_id);
              return [
                service.name,
                service.due_day ? `Día ${service.due_day}` : "—",
                money.format(service.monthly_amount),
                payment ? money.format(payment.amount_paid) : "—",
                <Badge variant={payment ? "default" : "secondary"}>
                  {payment ? "Pagado" : "Pendiente"}
                </Badge>,
              ];
            })}
        />
      )}
    </div>
  );
}
function Finance({
  expenses,
}: {
  expenses: ReturnType<typeof useDashboard>["expenses"];
}) {
  return (
    <DataCard
      title="Gastos"
      description={`${expenses.length} movimientos`}
      headers={["Fecha", "Categoría", "Descripción", "Importe"]}
      rows={expenses.map((e) => [
        e.expense_date
          ? date.format(new Date(`${e.expense_date}T12:00:00`))
          : "—",
        e.category,
        e.description || "Sin detalle",
        money.format(e.amount),
      ])}
    />
  );
}
function Cash({
  shifts,
  vitrineItems,
}: {
  shifts: ReturnType<typeof useDashboard>["shifts"];
  vitrineItems: ReturnType<typeof useDashboard>["vitrineItems"];
}) {
  return (
    <DataCard
      title="Turnos de caja"
      description="Aperturas, cierres y conteo real de vitrina"
      headers={["Fecha", "Turno", "Estado", "Ventas", "Órdenes", "Vitrina cierre"]}
      rows={shifts.map((s) => [
        s.shift_date,
        s.shift,
        <Badge variant={s.status === "closed" ? "outline" : "default"}>
          {s.status}
        </Badge>,
        money.format(s.total_sales),
        s.order_count,
        <VitrineClosingSnapshot shift={s} vitrineItems={vitrineItems} />,
      ])}
    />
  );
}
function VitrineClosingSnapshot({
  shift,
  vitrineItems,
}: {
  shift: ReturnType<typeof useDashboard>["shifts"][number];
  vitrineItems: ReturnType<typeof useDashboard>["vitrineItems"];
}) {
  const actual = shift.stock_end_actual ?? shift.stock_system ?? shift.stock_start;
  if (!actual) return <span className="muted-cell">Sin conteo</span>;
  const visibleItems = vitrineItems
    .filter((item) => item.active && item.show_on_close)
    .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
  if (!visibleItems.length) return <span className="muted-cell">Sin items</span>;
  return (
    <div className="vitrine-list">
      {visibleItems.map((item) => {
        const key = String(item.local_id);
        const real = actual[key] ?? 0;
        const system = shift.stock_system?.[key];
        const differs =
          typeof system === "number" && Math.abs(system - real) > 0.001;
        return (
          <span
            className={`vitrine-pill${differs ? " vitrine-pill--diff" : ""}`}
            key={item.id}
            title={
              differs
                ? `Conteo real: ${formatQuantity(real)}. Sistema: ${formatQuantity(system)}.`
                : "Conteo real al cierre"
            }
          >
            <strong>{item.label}</strong>
            <span>Real {formatQuantity(real)}</span>
            {differs && <em>Sistema {formatQuantity(system)}</em>}
          </span>
        );
      })}
    </div>
  );
}
function RequestStatusBadge({
  status,
  error,
}: {
  status: "pending" | "applied" | "rejected";
  error?: string | null;
}) {
  const label =
    status === "applied"
      ? "Aplicado"
      : status === "rejected"
        ? "Rechazado"
        : "Pendiente";
  const variant =
    status === "applied" ? "default" : status === "rejected" ? "danger" : "secondary";
  return (
    <span className="request-status" title={error ?? undefined}>
      <Badge variant={variant}>{label}</Badge>
      {error && <small>{error}</small>}
    </span>
  );
}
function RequestHistory({
  title,
  rows,
}: {
  title: string;
  rows: (string | number | React.ReactNode)[][];
}) {
  return (
    <DataCard
      title={title}
      description="Pedidos enviados desde el dashboard"
      headers={["Fecha", "Valor", "Detalle", "Estado"]}
      rows={rows}
      readOnly={false}
    />
  );
}
function Stock({
  data,
  stockAdjustmentRequests,
  onCreateStockAdjustment,
}: {
  data: ReturnType<typeof useDashboard>["stock"];
  stockAdjustmentRequests: ReturnType<typeof useDashboard>["stockAdjustmentRequests"];
  onCreateStockAdjustment: ReturnType<
    typeof useDashboard
  >["createStockAdjustmentRequest"];
}) {
  const activeStock = data.filter((item) => item.active);
  const [productId, setProductId] = useState(activeStock[0]?.id ?? "");
  const [mode, setMode] = useState<"set" | "delta">("set");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Ajuste desde dashboard");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedProduct =
    data.find((item) => item.id === productId) ?? activeStock[0] ?? null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (!selectedProduct) throw new Error("Elegí un producto de stock");
      const parsedQuantity = Number(quantity);
      if (!Number.isFinite(parsedQuantity)) throw new Error("Cantidad inválida");
      await onCreateStockAdjustment({
        stock_product_public_id: selectedProduct.id,
        stock_product_name: selectedProduct.name,
        mode,
        quantity: parsedQuantity,
        reason,
        note,
      });
      setQuantity("");
      setNote("");
      setMessage("Ajuste enviado a la notebook para aplicar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="admin-write-stack">
      <Card className="write-card">
        <CardHeader>
          <div>
            <CardTitle>Ajustar stock</CardTitle>
            <CardDescription>
              El cambio queda pendiente hasta que la notebook lo aplique localmente.
            </CardDescription>
          </div>
          <Badge variant="outline">ESCRITURA CONTROLADA</Badge>
        </CardHeader>
        <CardContent>
          <form className="write-form" onSubmit={submit}>
            <label className="write-form__wide">
              Producto
              <select
                value={selectedProduct?.id ?? ""}
                onChange={(event) => setProductId(event.target.value)}
                required
              >
                {activeStock.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · actual {formatQuantity(item.current_stock)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modo
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as typeof mode)}
              >
                <option value="set">Dejar en</option>
                <option value="delta">Sumar/restar</option>
              </select>
            </label>
            <label>
              Cantidad
              <input
                inputMode="decimal"
                placeholder={mode === "set" ? "Nuevo total" : "Ej: -2 o 10"}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>
            <label>
              Motivo
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </label>
            <label className="write-form__wide">
              Nota
              <input
                placeholder="Opcional"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <Button disabled={saving} type="submit">
              {saving ? "Enviando..." : "Enviar ajuste"}
            </Button>
          </form>
          {message && <p className="write-message">{message}</p>}
        </CardContent>
      </Card>
      <DataCard
        title="Control de stock"
        description="Existencias y umbrales"
        headers={["Producto", "Disponible", "Umbral", "Estado"]}
        rows={data.map((s) => [
          s.name,
          formatQuantity(s.current_stock),
          formatQuantity(s.alert_threshold),
          <Badge
            variant={s.current_stock <= s.alert_threshold ? "danger" : "outline"}
          >
            {s.current_stock <= s.alert_threshold ? "Bajo" : "Bien"}
          </Badge>,
        ])}
      />
      <RequestHistory
        title="Ajustes recientes"
        rows={stockAdjustmentRequests.slice(0, 8).map((request) => [
          request.created_at ? date.format(new Date(request.created_at)) : "—",
          `${request.mode === "set" ? "Dejar en" : "Ajuste"} ${formatQuantity(
            request.quantity,
          )}`,
          request.stock_product_name || request.reason,
          <RequestStatusBadge
            status={request.status}
            error={request.error_message}
          />,
        ])}
      />
    </div>
  );
}
function Catalog({
  products,
}: {
  products: ReturnType<typeof useDashboard>["products"];
}) {
  return (
    <DataCard
      title="Catálogo"
      description={`${products.filter((p) => p.active).length} productos activos`}
      headers={["Producto", "Precio", "Estado"]}
      rows={products.map((p) => [
        p.name,
        money.format(p.price),
        <Badge variant={p.active ? "default" : "secondary"}>
          {p.active ? "Activo" : "Inactivo"}
        </Badge>,
      ])}
    />
  );
}
function Sync({
  devices,
}: {
  devices: ReturnType<typeof useDashboard>["devices"];
}) {
  return (
    <DataCard
      title="Dispositivos"
      description="Salud de la réplica local"
      headers={["Equipo", "Última conexión", "Estado"]}
      rows={devices.map((d) => [
        d.name,
        d.last_seen_at ? date.format(new Date(d.last_seen_at)) : "Nunca",
        <Badge variant={d.active ? "default" : "danger"}>
          {d.active ? "Autorizado" : "Revocado"}
        </Badge>,
      ])}
    />
  );
}
function DataCard({
  title,
  description,
  headers,
  rows,
  readOnly = true,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  readOnly?: boolean;
}) {
  return (
    <Card className="data-card">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {readOnly && <Badge variant="outline">SOLO LECTURA</Badge>}
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty
            title="Sin información"
            description="Los datos aparecerán después de sincronizar la notebook del local."
          />
        )}
      </CardContent>
    </Card>
  );
}
export default App;
