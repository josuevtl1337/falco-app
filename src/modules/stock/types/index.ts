export interface StockProduct {
  id: number;
  name: string;
  current_stock: number;
  alert_threshold: number;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export interface StockMenuItemMap {
  id: number;
  stock_product_id: number;
  menu_item_id: number;
  menu_item_name?: string;
  quantity_per_item: number;
}

export interface StockMovement {
  id: number;
  stock_product_id: number;
  stock_product_name?: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  order_id?: number;
  created_at?: string;
}

export interface LowStockAlert {
  id: number;
  name: string;
  current_stock: number;
  alert_threshold: number;
}

export interface MenuItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  is_active: number;
  category_id?: number;
  category_name?: string;
}


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
