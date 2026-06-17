import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconBrandWhatsapp,
  IconPlus,
  IconReceipt2,
  IconSearch,
  IconUserCircle,
  IconWallet,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import MonthSelector from "@/modules/finance/components/month-selector";
import PaymentSection, { PaymentSummary } from "@/modules/hall/cmp/checkout/payment-section";
import { formatARS } from "@/modules/commons/utils/helpers";

interface Customer {
  id: number;
  name: string;
  phone: string;
  notes: string;
  balance: number;
  total_charged: number;
  total_paid: number;
  total_discount: number;
  order_count: number;
  last_order_at: string | null;
}

interface AccountItem {
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface AccountCharge {
  id: number;
  table_number: string;
  status: "debt" | "paid" | string;
  total_amount: number;
  created_at: string;
  items: AccountItem[];
}

interface AccountPayment {
  id: number;
  amount_paid: number;
  discount_amount: number;
  discount_percentage: number;
  payment_date: string;
  payment_method_name: string;
  notes: string;
}

interface AccountDetail {
  customer: Customer;
  charges: AccountCharge[];
  payments: AccountPayment[];
  period: {
    charged: number;
    paid: number;
    discount: number;
    balance: number;
  };
  balance: number;
}

const API_URL = "http://localhost:3001/api";
function formatDate(value: string) {
  return new Date(value.replace(" ", "T")).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function CustomersPage() {
  const now = new Date();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentSummary | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", notes: "" });

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.notes]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [customers, search]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  const totalBalance = useMemo(
    () => customers.reduce((acc, customer) => acc + Number(customer.balance || 0), 0),
    [customers],
  );

  const fetchCustomers = useCallback(async () => {
    const response = await fetch(`${API_URL}/customers`);
    if (!response.ok) throw new Error("Error al cargar clientes");
    const data = await response.json();
    setCustomers(data);
    setSelectedCustomerId((current) => current ?? data[0]?.id ?? null);
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!selectedCustomerId) {
      setDetail(null);
      return;
    }
    const response = await fetch(
      `${API_URL}/customers/${selectedCustomerId}/account?month=${month}&year=${year}`,
    );
    if (!response.ok) throw new Error("Error al cargar cuenta corriente");
    setDetail(await response.json());
  }, [month, selectedCustomerId, year]);

  useEffect(() => {
    setLoading(true);
    fetchCustomers()
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [fetchCustomers]);

  useEffect(() => {
    fetchDetail().catch((err) => toast.error(err.message));
  }, [fetchDetail]);

  const refresh = useCallback(async () => {
    await fetchCustomers();
    await fetchDetail();
  }, [fetchCustomers, fetchDetail]);

  const createCustomer = async () => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo crear el cliente");
      }
      const created = await response.json();
      toast.success("Cliente creado");
      setCustomerDialogOpen(false);
      setCustomerForm({ name: "", phone: "", notes: "" });
      await fetchCustomers();
      setSelectedCustomerId(created.id);
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear el cliente");
    }
  };

  const registerPayment = async () => {
    if (!selectedCustomerId || !paymentData?.paymentMethod || !detail) return;

    const discountAmount = Math.max(0, detail.balance - paymentData.total_amount);

    try {
      const response = await fetch(`${API_URL}/customers/${selectedCustomerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: Number(paymentData.paymentMethod.id),
          amount_paid: paymentData.total_amount,
          discount_amount: discountAmount,
          discount_percentage: paymentData.discount_percentage,
          payment_date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo registrar el pago");
      }
      toast.success("Pago registrado");
      setPaymentDialogOpen(false);
      setPaymentData(null);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "No se pudo registrar el pago");
    }
  };

  const summaryText = useMemo(() => {
    if (!detail) return "";
    const subtotal = detail.period.charged;
    const discountPercentage =
      subtotal > 0 && detail.period.discount > 0
        ? Math.round((detail.period.discount / subtotal) * 100)
        : 0;

    const lines = [
      `Hola ${detail.customer.name}, te paso el resumen de tu cuenta corriente:`,
      "",
      `Subtotal: ${formatARS(subtotal)}`,
      ...(discountPercentage > 0 ? [`Descuento: ${discountPercentage}%`] : []),
      `Total a pagar: ${formatARS(detail.balance)}`,
    ];
    return lines.join("\n");
  }, [detail]);

  const copySummary = async () => {
    await navigator.clipboard.writeText(summaryText);
    toast.success("Resumen copiado para WhatsApp");
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <IconWallet className="text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-slate-100">Clientes</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Cuenta corriente, consumos diarios y cobros mensuales.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <MonthSelector
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
          <Button onClick={() => setCustomerDialogOpen(true)}>
            <IconPlus data-icon="inline-start" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card className="rounded-lg border-[var(--card-border)] bg-[var(--card-background)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-slate-400">Saldo total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatARS(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-[var(--card-border)] bg-[var(--card-background)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-slate-400">Clientes activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-[var(--card-border)] bg-[var(--card-background)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-slate-400">Periodo seleccionado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatARS(detail?.period.charged ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid h-[calc(100vh-250px)] min-h-[560px] gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="min-h-0 rounded-lg border-[var(--card-border)] bg-[var(--card-background)] py-4">
          <CardHeader className="px-4">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-2.5 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 px-2">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-2 px-2">
                {loading && <div className="p-3 text-sm text-slate-400">Cargando clientes...</div>}
                {!loading && filteredCustomers.length === 0 && (
                  <div className="p-3 text-sm text-slate-400">No hay clientes todavía.</div>
                )}
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selectedCustomerId === customer.id
                        ? "border-[var(--primary)] bg-primary/10"
                        : "border-[var(--card-border)] hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{customer.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {customer.order_count || 0} consumos
                        </div>
                      </div>
                      <Badge variant={customer.balance > 0 ? "default" : "secondary"}>
                        {formatARS(customer.balance || 0)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="min-h-0 rounded-lg border-[var(--card-border)] bg-[var(--card-background)] py-4">
          {selectedCustomer && detail ? (
            <>
              <CardHeader className="border-b border-[var(--card-border)] px-5 pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15">
                      <IconUserCircle className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{selectedCustomer.name}</CardTitle>
                      <div className="text-sm text-slate-400">
                        {selectedCustomer.phone || "Sin telefono"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={copySummary} disabled={!detail.charges.length}>
                      <IconBrandWhatsapp data-icon="inline-start" />
                      Copiar para WhatsApp
                    </Button>
                    <Button onClick={() => setPaymentDialogOpen(true)} disabled={detail.balance <= 0}>
                      <IconReceipt2 data-icon="inline-start" />
                      Cobrar cuenta
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid min-h-0 gap-4 p-5 lg:grid-cols-[1fr_280px]">
                <ScrollArea className="min-h-0">
                  <div className="flex flex-col gap-3 pr-3">
                    {detail.charges.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[var(--card-border)] p-8 text-center text-sm text-slate-400">
                        Sin consumos para este periodo.
                      </div>
                    )}
                    {detail.charges.map((charge) => (
                      <div
                        key={charge.id}
                        className="rounded-lg border border-[var(--card-border)] bg-background/30 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                          <div className="text-sm font-semibold text-white">
                            Comanda #{charge.id}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatDate(charge.created_at)} · {charge.table_number}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={charge.status === "debt" ? "outline" : "secondary"}>
                            {charge.status === "debt" ? "A cuenta" : "Pagada"}
                          </Badge>
                          <div className="text-lg font-bold text-white">
                            {formatARS(charge.total_amount)}
                          </div>
                        </div>
                      </div>
                        <div className="flex flex-col gap-2">
                          {charge.items.map((item) => (
                            <div
                              key={`${charge.id}-${item.menu_item_id}`}
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span className="text-slate-300">
                                {item.quantity}x {item.menu_item_name}
                              </span>
                              <span className="font-medium text-white">
                                {formatARS(item.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-[var(--card-border)] bg-background/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Saldo actual</div>
                    <div className="mt-1 text-3xl font-bold text-white">
                      {formatARS(detail.balance)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--card-border)] bg-background/30 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-300">Este periodo</div>
                    <AccountLine label="Consumos" value={detail.period.charged} />
                    <AccountLine label="Pagos" value={detail.period.paid} />
                    <AccountLine label="Descuentos" value={detail.period.discount} />
                    <AccountLine label="Saldo periodo" value={detail.period.balance} strong />
                  </div>
                  <div className="rounded-lg border border-[var(--card-border)] bg-background/30 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-300">Pagos</div>
                    <div className="flex flex-col gap-2">
                      {detail.payments.length === 0 && (
                        <div className="text-sm text-slate-500">Sin pagos en este periodo.</div>
                      )}
                      {detail.payments.map((payment) => (
                        <div key={payment.id} className="rounded-md bg-muted/20 p-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-300">{payment.payment_method_name}</span>
                            <span className="font-semibold text-white">
                              {formatARS(payment.amount_paid)}
                            </span>
                          </div>
                          {payment.discount_amount > 0 && (
                            <div className="mt-1 text-xs text-slate-400">
                              Descuento {formatARS(payment.discount_amount)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-full items-center justify-center text-sm text-slate-400">
              Selecciona o crea un cliente para ver su cuenta.
            </CardContent>
          )}
        </Card>
      </div>

      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
            <DialogDescription>Alta rapida para empezar a cargar consumos a cuenta.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={customerForm.name}
              onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nombre y apellido"
            />
            <Input
              value={customerForm.phone}
              onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Telefono o WhatsApp"
            />
            <Textarea
              value={customerForm.notes}
              onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Notas"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createCustomer} disabled={!customerForm.name.trim()}>
              Crear cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Cobrar cuenta</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} · saldo {formatARS(detail?.balance ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <PaymentSection subtotal={Math.max(0, detail?.balance ?? 0)} onChange={setPaymentData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={registerPayment} disabled={!paymentData?.paymentMethod}>
              Registrar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function AccountLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1 text-sm ${strong ? "font-semibold text-white" : "text-slate-400"}`}>
      <span>{label}</span>
      <span>{formatARS(value)}</span>
    </div>
  );
}

export default CustomersPage;
