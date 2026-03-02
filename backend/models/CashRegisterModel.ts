import db from "../db.ts";
import ShiftModel from "./ShiftModel.ts";

export const BAKERY_PRODUCT_NAMES = [
  "Medialunas Dulces",
  "Medialunas Saladas",
  "Croissant",
  "Pan de Chocolate",
  "Pan de Ciabatta",
  "Roll de Canela",
];

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
  stock_start: string;
  stock_system: string | null;
  stock_end_actual: string | null;
  total_sales: number;
  order_count: number;
  status: "open" | "closed";
}

export interface OpeningData {
  shift: string;
  cash_start: number;
  bank_start: number;
  stock_start: Record<string, number>;
}

export interface ClosingData {
  register_id: number;
  cash_end: number;
  bank_end: number;
  stock_end_actual: Record<string, number>;
}

export const CashRegisterModel = {
  getStatus: () => {
    const register = db
      .prepare(
        `SELECT * FROM cash_register_shifts WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1`
      )
      .get() as CashRegisterShift | undefined;

    if (!register) {
      return { register: null, bakeryProducts: BAKERY_PRODUCT_NAMES };
    }

    // Compute live sales totals for the open register
    const salesResult = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total_sales,
                COUNT(*) as order_count
         FROM orders
         WHERE status = 'paid' AND created_at >= ?`
      )
      .get(register.opened_at) as { total_sales: number; order_count: number };

    return {
      register: {
        ...register,
        stock_start: JSON.parse(register.stock_start || "{}"),
        stock_system: register.stock_system
          ? JSON.parse(register.stock_system)
          : null,
        stock_end_actual: register.stock_end_actual
          ? JSON.parse(register.stock_end_actual)
          : null,
        total_sales: salesResult.total_sales,
        order_count: salesResult.order_count,
      },
      bakeryProducts: BAKERY_PRODUCT_NAMES,
    };
  },

  open: (data: OpeningData) => {
    return db.transaction(() => {
      // Validate no other register is open
      const existing = db
        .prepare(`SELECT id FROM cash_register_shifts WHERE status = 'open' LIMIT 1`)
        .get();

      if (existing) {
        throw new Error("There is already an open cash register. Close it before opening a new one.");
      }

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const opened_at = now.toISOString();

      const result = db
        .prepare(
          `INSERT INTO cash_register_shifts (shift, date, opened_at, cash_start, bank_start, stock_start, status)
           VALUES (?, ?, ?, ?, ?, ?, 'open')`
        )
        .run(
          data.shift,
          date,
          opened_at,
          data.cash_start,
          data.bank_start,
          JSON.stringify(data.stock_start)
        );

      // Return the created register
      const register = db
        .prepare(`SELECT * FROM cash_register_shifts WHERE id = ?`)
        .get(result.lastInsertRowid) as CashRegisterShift;

      return {
        ...register,
        stock_start: JSON.parse(register.stock_start || "{}"),
        stock_system: null,
        stock_end_actual: null,
      };
    })();
  },

  close: (data: ClosingData) => {
    return db.transaction(() => {
      const register = db
        .prepare(`SELECT * FROM cash_register_shifts WHERE id = ? AND status = 'open'`)
        .get(data.register_id) as CashRegisterShift | undefined;

      if (!register) {
        throw new Error("No open cash register found with that ID.");
      }

      const stockStart = JSON.parse(register.stock_start || "{}") as Record<
        string,
        number
      >;

      // Calculate stock_system: stock_start - quantity sold during shift
      const placeholders = BAKERY_PRODUCT_NAMES.map(() => "?").join(", ");
      const soldRows = db
        .prepare(
          `SELECT sp.name, COALESCE(SUM(oi.quantity), 0) as total_sold
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           JOIN stock_menu_item_map smi ON smi.menu_item_id = oi.menu_item_id
           JOIN stock_products sp ON sp.id = smi.stock_product_id
           WHERE o.status = 'paid'
             AND o.created_at >= ?
             AND sp.name IN (${placeholders})
           GROUP BY sp.name`
        )
        .all(register.opened_at, ...BAKERY_PRODUCT_NAMES) as Array<{
        name: string;
        total_sold: number;
      }>;

      const soldMap = new Map(soldRows.map((r) => [r.name, r.total_sold]));

      const stockSystem: Record<string, number> = {};
      for (const name of BAKERY_PRODUCT_NAMES) {
        const start = stockStart[name] ?? 0;
        const sold = soldMap.get(name) ?? 0;
        stockSystem[name] = start - sold;
      }

      // Calculate total sales and order count
      const salesResult = db
        .prepare(
          `SELECT COALESCE(SUM(total_amount), 0) as total_sales,
                  COUNT(*) as order_count
           FROM orders
           WHERE status = 'paid' AND created_at >= ?`
        )
        .get(register.opened_at) as {
        total_sales: number;
        order_count: number;
      };

      const closed_at = new Date().toISOString();

      db.prepare(
        `UPDATE cash_register_shifts
         SET closed_at = ?,
             cash_end = ?,
             bank_end = ?,
             stock_system = ?,
             stock_end_actual = ?,
             total_sales = ?,
             order_count = ?,
             status = 'closed'
         WHERE id = ?`
      ).run(
        closed_at,
        data.cash_end,
        data.bank_end,
        JSON.stringify(stockSystem),
        JSON.stringify(data.stock_end_actual),
        salesResult.total_sales,
        salesResult.order_count,
        data.register_id
      );

      // Return updated register
      const updated = db
        .prepare(`SELECT * FROM cash_register_shifts WHERE id = ?`)
        .get(data.register_id) as CashRegisterShift;

      return {
        ...updated,
        stock_start: JSON.parse(updated.stock_start || "{}"),
        stock_system: JSON.parse(updated.stock_system || "{}"),
        stock_end_actual: JSON.parse(updated.stock_end_actual || "{}"),
      };
    })();
  },

  // Trigger backup after closing (called outside transaction)
  triggerBackup: async (shift: string) => {
    try {
      await ShiftModel.closeShift(shift);
    } catch (err) {
      console.error("Error creating backup on register close:", err);
    }
  },

  // Calculate current bakery stock from cash register data only (stock_start - sold during shift)
  // This is independent from the Stock Control module's stock_products table
  getCurrentBakeryStock: () => {
    const register = db
      .prepare(
        `SELECT * FROM cash_register_shifts WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1`
      )
      .get() as CashRegisterShift | undefined;

    if (!register) {
      // No open register, return zeros
      const stock: Record<string, number> = {};
      for (const name of BAKERY_PRODUCT_NAMES) {
        stock[name] = 0;
      }
      return stock;
    }

    const stockStart = JSON.parse(register.stock_start || "{}") as Record<
      string,
      number
    >;

    // Calculate how many bakery items were sold since the register opened
    const placeholders = BAKERY_PRODUCT_NAMES.map(() => "?").join(", ");
    const soldRows = db
      .prepare(
        `SELECT sp.name, COALESCE(SUM(oi.quantity), 0) as total_sold
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN stock_menu_item_map smi ON smi.menu_item_id = oi.menu_item_id
         JOIN stock_products sp ON sp.id = smi.stock_product_id
         WHERE o.status = 'paid'
           AND o.created_at >= ?
           AND sp.name IN (${placeholders})
         GROUP BY sp.name`
      )
      .all(register.opened_at, ...BAKERY_PRODUCT_NAMES) as Array<{
      name: string;
      total_sold: number;
    }>;

    const soldMap = new Map(soldRows.map((r) => [r.name, r.total_sold]));

    const stock: Record<string, number> = {};
    for (const name of BAKERY_PRODUCT_NAMES) {
      const start = stockStart[name] ?? 0;
      const sold = soldMap.get(name) ?? 0;
      stock[name] = start - sold;
    }
    return stock;
  },
};
