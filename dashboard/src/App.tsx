import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BookOpen,
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
  const d = useDashboard();
  const paid = d.orders.filter((o) => o.status === "paid"),
    revenue = paid.reduce((s, o) => s + Number(o.total_amount), 0),
    expenses = d.expenses.reduce((s, e) => s + Number(e.amount), 0),
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
      .slice(-14)
      .map(([day, total]) => ({ day: day.slice(5), total }));
  }, [d.orders]);
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
              <Summary
                revenue={revenue}
                expenses={expenses}
                orders={paid.length}
                low={low.length}
                chart={chart}
              />
            )}{" "}
            {page === "ventas" && <Sales orders={d.orders} />}{" "}
            {page === "finanzas" && <Finance expenses={d.expenses} />}{" "}
            {page === "caja" && <Cash shifts={d.shifts} />}{" "}
            {page === "stock" && <Stock data={d.stock} />}{" "}
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
}: {
  shifts: ReturnType<typeof useDashboard>["shifts"];
}) {
  return (
    <DataCard
      title="Turnos de caja"
      description="Aperturas y cierres del local"
      headers={["Fecha", "Turno", "Estado", "Ventas", "Órdenes"]}
      rows={shifts.map((s) => [
        s.shift_date,
        s.shift,
        <Badge variant={s.status === "closed" ? "outline" : "default"}>
          {s.status}
        </Badge>,
        money.format(s.total_sales),
        s.order_count,
      ])}
    />
  );
}
function Stock({ data }: { data: ReturnType<typeof useDashboard>["stock"] }) {
  return (
    <DataCard
      title="Control de stock"
      description="Existencias y umbrales"
      headers={["Producto", "Disponible", "Umbral", "Estado"]}
      rows={data.map((s) => [
        s.name,
        s.current_stock,
        s.alert_threshold,
        <Badge
          variant={s.current_stock <= s.alert_threshold ? "danger" : "outline"}
        >
          {s.current_stock <= s.alert_threshold ? "Bajo" : "Bien"}
        </Badge>,
      ])}
    />
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
}: {
  title: string;
  description: string;
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
}) {
  return (
    <Card className="data-card">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="outline">SOLO LECTURA</Badge>
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
