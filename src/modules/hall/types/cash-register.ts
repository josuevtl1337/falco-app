export interface VitrineStockMenuItemMap {
  id: number;
  vitrine_stock_item_id: number;
  menu_item_id: number;
  menu_item_name?: string;
  quantity_per_item: number;
}

export interface VitrineStockItem {
  id: number;
  label: string;
  unit_step: number;
  show_on_open: number;
  show_on_close: number;
  active: number;
  sort_order: number;
  mappings?: VitrineStockMenuItemMap[];
  created_at?: string;
  updated_at?: string;
}

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
