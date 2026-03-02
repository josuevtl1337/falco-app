export const BAKERY_PRODUCTS = [
  "Medialunas Dulces",
  "Medialunas Saladas",
  "Croissant",
  "Pan de Chocolate",
  "Pan de Ciabatta",
  "Roll de Canela",
] as const;

export type BakeryProductName = (typeof BAKERY_PRODUCTS)[number];

export interface CashRegisterShift {
  id: number;
  shift: string;
  date: string;
  opened_by: string;
  closed_by: string;
  opened_at: string;
  closed_at: string | null;
  cash_start: number;
  cash_end: number | null;
  bank_start: number;
  bank_end: number | null;
  stock_start: Record<string, number>;
  stock_system: Record<string, number> | null;
  stock_end_actual: Record<string, number> | null;
  total_sales: number;
  order_count: number;
  status: "open" | "closed";
}

export interface OpeningPayload {
  shift: string;
  cash_start: number;
  bank_start: number;
  stock_start: Record<string, number>;
}

export interface ClosingPayload {
  register_id: number;
  cash_end: number;
  bank_end: number;
  stock_end_actual: Record<string, number>;
}
