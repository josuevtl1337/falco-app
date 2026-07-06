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
export type Order = {
  id: string;
  status: string;
  total_amount: number;
  shift: string;
  source_created_at: string;
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
  name: string;
  price: number;
  active: boolean;
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
};
export type SyncInfo = {
  id: string;
  name: string;
  last_seen_at: string | null;
  active: boolean;
};
export function useDashboard() {
  const [data, setData] = useState<{
    orders: Order[];
    expenses: Expense[];
    stock: Stock[];
    products: Product[];
    shifts: CashShift[];
    devices: SyncInfo[];
  }>({
    orders: [],
    expenses: [],
    stock: [],
    products: [],
    shifts: [],
    devices: [],
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const queries = await Promise.all([
      fetchAllRows<Order>("dashboard_orders", "source_created_at", false),
      fetchAllRows<Expense>("dashboard_expenses", "expense_date", false),
      fetchAllRows<Stock>("dashboard_stock", "name"),
      fetchAllRows<Product>("dashboard_catalog", "name"),
      fetchAllRows<CashShift>("dashboard_cash_shifts", "shift_date", false),
      supabase.from("devices").select("id,name,last_seen_at,active"),
    ]);
    const failure = queries.find((q) => q.error)?.error;
    if (failure) setError(failure.message);
    else {
      setError("");
      setData({
        orders: queries[0].data,
        expenses: queries[1].data,
        stock: queries[2].data,
        products: queries[3].data,
        shifts: queries[4].data,
        devices: (queries[5].data ?? []) as SyncInfo[],
      });
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { ...data, loading, error, reload: load };
}
