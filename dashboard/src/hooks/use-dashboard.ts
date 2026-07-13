import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 1_000;

async function fetchAllRows<T>(
  table: string,
  orderColumn: string,
  ascending = true,
): Promise<{ data: T[]; error: Error | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .is("deleted_at", null)
      .order(orderColumn, { ascending })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { data: [], error };
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}
type SyncedRecord = {
  id: string;
  source_local_id: number | null;
  source_created_at?: string | null;
  data: Record<string, unknown>;
};
async function fetchSyncedRecords(
  sourceTable: string,
  ascending = true,
): Promise<{ data: SyncedRecord[]; error: Error | null }> {
  const rows: SyncedRecord[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("synced_records")
      .select("id,source_local_id,source_created_at,data")
      .eq("source_table", sourceTable)
      .is("deleted_at", null)
      .order("source_local_id", { ascending })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { data: [], error };
    rows.push(...((data ?? []) as SyncedRecord[]));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}
function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function parseStockSnapshot(value: unknown): Record<string, number> | null {
  if (!value) return null;
  const raw =
    typeof value === "string"
      ? (JSON.parse(value || "{}") as Record<string, unknown>)
      : (value as Record<string, unknown>);
  return Object.fromEntries(
    Object.entries(raw).map(([key, quantity]) => [key, numberValue(quantity)]),
  );
}
export type Order = {
  id: string;
  local_id: number;
  status: string;
  total_amount: number;
  shift: string;
  source_created_at: string;
};
export type OrderItem = {
  id: string;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
};
export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
};
export type Stock = {
  id: string;
  name: string;
  current_stock: number;
  alert_threshold: number;
  active: boolean;
};
export type Product = {
  id: string;
  local_id: number;
  name: string;
  price: number;
  active: boolean;
};
export type Service = {
  id: string;
  local_id: number;
  name: string;
  monthly_amount: number;
  due_day: number;
  category: string;
  active: boolean;
};
export type ServicePayment = {
  id: string;
  service_id: number;
  month: number;
  year: number;
  amount_paid: number;
  payment_date: string;
  notes: string;
};
export type CashShift = {
  id: string;
  status: string;
  shift_date: string;
  shift: string;
  cash_start: number;
  cash_end: number;
  bank_start: number;
  bank_end: number;
  total_sales: number;
  order_count: number;
  stock_start: Record<string, number> | null;
  stock_system: Record<string, number> | null;
  stock_end_actual: Record<string, number> | null;
};
export type VitrineItem = {
  id: string;
  local_id: number;
  label: string;
  show_on_close: boolean;
  active: boolean;
  sort_order: number;
};
export type SyncInfo = {
  id: string;
  name: string;
  last_seen_at: string | null;
  active: boolean;
};
export type AdminExpenseRequest = {
  id: string;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  status: "pending" | "applied" | "rejected";
  error_message: string | null;
  created_at: string;
  applied_at: string | null;
};
export type AdminStockAdjustmentRequest = {
  id: string;
  stock_product_public_id: string;
  stock_product_name: string;
  mode: "set" | "delta";
  quantity: number;
  reason: string;
  note: string;
  status: "pending" | "applied" | "rejected";
  error_message: string | null;
  created_at: string;
  applied_at: string | null;
};
type BranchContext = {
  id: string;
  business_id: string;
};
function mapCashShift(record: SyncedRecord): CashShift {
  const row = record.data;
  return {
    id: record.id,
    status: String(row.status ?? ""),
    shift_date: String(row.date ?? ""),
    shift: String(row.shift ?? ""),
    cash_start: numberValue(row.cash_start),
    cash_end: numberValue(row.cash_end),
    bank_start: numberValue(row.bank_start),
    bank_end: numberValue(row.bank_end),
    total_sales: numberValue(row.total_sales),
    order_count: numberValue(row.order_count),
    stock_start: parseStockSnapshot(row.stock_start),
    stock_system: parseStockSnapshot(row.stock_system),
    stock_end_actual: parseStockSnapshot(row.stock_end_actual),
  };
}
function mapOrder(record: SyncedRecord): Order {
  const row = record.data;
  return {
    id: record.id,
    local_id: Number(record.source_local_id ?? row.id ?? 0),
    status: String(row.status ?? ""),
    total_amount: numberValue(row.total_amount),
    shift: String(row.shift ?? ""),
    source_created_at: String(row.created_at ?? record.source_created_at ?? ""),
  };
}
function mapOrderItem(record: SyncedRecord): OrderItem {
  const row = record.data;
  return {
    id: record.id,
    order_id: Number(row.order_id ?? 0),
    menu_item_id: Number(row.menu_item_id ?? 0),
    quantity: numberValue(row.quantity),
    unit_price: numberValue(row.unit_price),
    subtotal: numberValue(row.subtotal),
    created_at: String(row.created_at ?? record.source_created_at ?? ""),
  };
}
function mapMenuItem(record: SyncedRecord): Product {
  const row = record.data;
  return {
    id: record.id,
    local_id: Number(record.source_local_id ?? row.id ?? 0),
    name: String(row.name ?? "Sin nombre"),
    price: numberValue(row.price),
    active: Number(row.is_active ?? 1) === 1,
  };
}
function mapService(record: SyncedRecord): Service {
  const row = record.data;
  return {
    id: record.id,
    local_id: Number(record.source_local_id ?? row.id ?? 0),
    name: String(row.name ?? "Servicio"),
    monthly_amount: numberValue(row.monthly_amount),
    due_day: Number(row.due_day ?? 0),
    category: String(row.category ?? ""),
    active: Number(row.active ?? 1) === 1,
  };
}
function mapServicePayment(record: SyncedRecord): ServicePayment {
  const row = record.data;
  return {
    id: record.id,
    service_id: Number(row.service_id ?? 0),
    month: Number(row.month ?? 0),
    year: Number(row.year ?? 0),
    amount_paid: numberValue(row.amount_paid),
    payment_date: String(row.payment_date ?? ""),
    notes: String(row.notes ?? ""),
  };
}
function mapVitrineItem(record: SyncedRecord): VitrineItem {
  const row = record.data;
  return {
    id: record.id,
    local_id: Number(record.source_local_id ?? row.id ?? 0),
    label: String(row.label ?? "Sin nombre"),
    show_on_close: Number(row.show_on_close ?? 1) === 1,
    active: Number(row.active ?? 1) === 1,
    sort_order: numberValue(row.sort_order),
  };
}
export function useDashboard() {
  const [data, setData] = useState<{
    orders: Order[];
    orderItems: OrderItem[];
    expenses: Expense[];
    stock: Stock[];
    products: Product[];
    services: Service[];
    servicePayments: ServicePayment[];
    shifts: CashShift[];
    vitrineItems: VitrineItem[];
    devices: SyncInfo[];
    expenseRequests: AdminExpenseRequest[];
    stockAdjustmentRequests: AdminStockAdjustmentRequest[];
    branch: BranchContext | null;
  }>({
    orders: [],
    orderItems: [],
    expenses: [],
    stock: [],
    products: [],
    services: [],
    servicePayments: [],
    shifts: [],
    vitrineItems: [],
    devices: [],
    expenseRequests: [],
    stockAdjustmentRequests: [],
    branch: null,
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const queries = await Promise.all([
      fetchSyncedRecords("orders", false),
      fetchSyncedRecords("order_items", false),
      fetchAllRows<Expense>("dashboard_expenses", "expense_date", false),
      fetchAllRows<Stock>("dashboard_stock", "name"),
      fetchSyncedRecords("menu_items"),
      fetchSyncedRecords("services"),
      fetchSyncedRecords("service_payments", false),
      fetchSyncedRecords("cash_register_shifts", false),
      fetchSyncedRecords("cash_register_stock_items"),
      supabase.from("devices").select("id,name,last_seen_at,active"),
      supabase
        .from("admin_expense_requests")
        .select("id,amount,category,description,expense_date,status,error_message,created_at,applied_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("admin_stock_adjustment_requests")
        .select("id,stock_product_public_id,stock_product_name,mode,quantity,reason,note,status,error_message,created_at,applied_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("branches").select("id,business_id").limit(1).maybeSingle(),
    ]);
    const failure = queries.find((q) => q.error)?.error;
    if (failure) setError(failure.message);
    else {
      setError("");
      setData({
        orders: queries[0].data.map(mapOrder),
        orderItems: queries[1].data.map(mapOrderItem),
        expenses: queries[2].data,
        stock: queries[3].data,
        products: queries[4].data.map(mapMenuItem),
        services: queries[5].data.map(mapService),
        servicePayments: queries[6].data.map(mapServicePayment),
        shifts: queries[7].data.map(mapCashShift),
        vitrineItems: queries[8].data.map(mapVitrineItem),
        devices: (queries[9].data ?? []) as SyncInfo[],
        expenseRequests: (queries[10].data ?? []) as AdminExpenseRequest[],
        stockAdjustmentRequests: (queries[11].data ??
          []) as AdminStockAdjustmentRequest[],
        branch: (queries[12].data ?? null) as BranchContext | null,
      });
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const createExpenseRequest = useCallback(
    async (payload: {
      amount: number;
      category: "servicios" | "proveedores" | "supermercado" | "otros";
      description: string;
      expense_date: string;
    }) => {
      if (!data.branch) throw new Error("No hay sucursal configurada");
      const { error } = await supabase.from("admin_expense_requests").insert({
        business_id: data.branch.business_id,
        branch_id: data.branch.id,
        amount: payload.amount,
        category: payload.category,
        description: payload.description,
        expense_date: payload.expense_date,
      });
      if (error) throw error;
      await load();
    },
    [data.branch, load],
  );
  const createStockAdjustmentRequest = useCallback(
    async (payload: {
      stock_product_public_id: string;
      stock_product_name: string;
      mode: "set" | "delta";
      quantity: number;
      reason: string;
      note: string;
    }) => {
      if (!data.branch) throw new Error("No hay sucursal configurada");
      const { error } = await supabase
        .from("admin_stock_adjustment_requests")
        .insert({
          business_id: data.branch.business_id,
          branch_id: data.branch.id,
          stock_product_public_id: payload.stock_product_public_id,
          stock_product_name: payload.stock_product_name,
          mode: payload.mode,
          quantity: payload.quantity,
          reason: payload.reason,
          note: payload.note,
        });
      if (error) throw error;
      await load();
    },
    [data.branch, load],
  );
  return {
    ...data,
    loading,
    error,
    reload: load,
    createExpenseRequest,
    createStockAdjustmentRequest,
  };
}
