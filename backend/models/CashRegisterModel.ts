import db, { getLocalTimestamp } from "../db.ts";
import ShiftModel from "./ShiftModel.ts";
import {
  VitrineStockModel,
  type VitrineStockItemWithMappings,
} from "./VitrineStockModel.ts";

function getPaidSalesByMethodSince(openedAtSqlite: string): {
  cashSales: number;
  bankSales: number;
} {
  const salesByMethod = db
    .prepare(
      `SELECT pm.name as method_name, pm.code as method_code, COALESCE(SUM(o.total_amount), 0) as total
       FROM orders o
       LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
       WHERE o.status = 'paid' AND o.created_at >= ?
       GROUP BY pm.name, pm.code
       UNION ALL
       SELECT pm.name as method_name, pm.code as method_code, COALESCE(SUM(cap.amount_paid), 0) as total
       FROM customer_account_payments cap
       LEFT JOIN payment_methods pm ON pm.id = cap.payment_method_id
       WHERE cap.created_at >= ?
       GROUP BY pm.name, pm.code`
    )
    .all(openedAtSqlite, openedAtSqlite) as Array<{
    method_name: string | null;
    method_code: string | null;
    total: number;
  }>;

  let cashSales = 0;
  let bankSales = 0;
  for (const row of salesByMethod) {
    if (row.method_code === "account" || row.method_name === "Cuenta corriente") {
      continue;
    }
    if (row.method_name === "Efectivo") {
      cashSales += row.total;
    } else {
      bankSales += row.total;
    }
  }

  return { cashSales, bankSales };
}

function getCollectedSalesSince(openedAtSqlite: string): {
  total_sales: number;
  order_count: number;
} {
  return db
    .prepare(
      `SELECT
         COALESCE(SUM(total_sales), 0) AS total_sales,
         COALESCE(SUM(order_count), 0) AS order_count
       FROM (
         SELECT
           COALESCE(SUM(o.total_amount), 0) AS total_sales,
           COUNT(*) AS order_count
         FROM orders o
         LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
         WHERE o.status = 'paid'
           AND o.created_at >= ?
           AND COALESCE(pm.code, '') != 'account'
         UNION ALL
         SELECT
           COALESCE(SUM(cap.amount_paid), 0) AS total_sales,
           0 AS order_count
         FROM customer_account_payments cap
         WHERE cap.created_at >= ?
       )`
    )
    .get(openedAtSqlite, openedAtSqlite) as {
    total_sales: number;
    order_count: number;
  };
}

function calculateClosingAmounts(register: CashRegisterShift): {
  cashEnd: number;
  bankEnd: number;
  cashSales: number;
  bankSales: number;
} {
  const openedAtSqlite = register.opened_at.replace("T", " ").replace("Z", "").replace(/\.\d{3}/, "");
  const { cashSales, bankSales } = getPaidSalesByMethodSince(openedAtSqlite);

  return {
    cashEnd: Math.max(0, register.cash_start + cashSales),
    bankEnd: Math.max(0, register.bank_start + bankSales),
    cashSales,
    bankSales,
  };
}

function getVitrineStockKey(item: VitrineStockItemWithMappings): string {
  return String(item.id);
}

function getVitrineStockQuantity(
  stock: Record<string, number>,
  item: VitrineStockItemWithMappings,
): number {
  return Number(stock[getVitrineStockKey(item)] ?? stock[item.label] ?? 0);
}

function normalizeVitrineStock(
  stock: Record<string, number>,
  items: VitrineStockItemWithMappings[],
): Record<string, number> {
  const normalized: Record<string, number> = {};
  for (const item of items) {
    normalized[getVitrineStockKey(item)] = getVitrineStockQuantity(stock, item);
  }
  return normalized;
}

function calculateVitrineStockSystem(
  stockStart: Record<string, number>,
  items: VitrineStockItemWithMappings[],
  openedAtSqlite: string,
): Record<string, number> {
  const soldMap = VitrineStockModel.getSoldQuantitiesSince(openedAtSqlite);
  const stockSystem: Record<string, number> = {};

  for (const item of items) {
    const start = getVitrineStockQuantity(stockStart, item);
    const sold = soldMap.get(item.id) ?? 0;
    stockSystem[getVitrineStockKey(item)] = start - sold;
  }

  return stockSystem;
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

    const vitrineStockItems = VitrineStockModel.getActive();

    if (!register) {
      return {
        register: null,
        bakeryProducts: vitrineStockItems.map((item) => item.label),
        vitrineStockItems,
        dailyClosedSales: 0,
        dailyClosedOrderCount: 0,
      };
    }

    // opened_at is already in SQLite-compatible format (YYYY-MM-DD HH:MM:SS) via getLocalTimestamp
    const openedAtSqlite = register.opened_at;

    // Compute live sales totals for the open register
    const salesResult = getCollectedSalesSince(openedAtSqlite);

    const dailyClosed = db
      .prepare(
        `SELECT COALESCE(SUM(total_sales), 0) as total_sales,
                COALESCE(SUM(order_count), 0) as order_count
         FROM cash_register_shifts
         WHERE date = ?
           AND status = 'closed'
           AND opened_at < ?`
      )
      .get(register.date, openedAtSqlite) as { total_sales: number; order_count: number };

    const { cashEnd, bankEnd } = calculateClosingAmounts(register);

    return {
      register: {
        ...register,
        stock_start: normalizeVitrineStock(
          JSON.parse(register.stock_start || "{}"),
          vitrineStockItems,
        ),
        stock_system: register.stock_system
          ? normalizeVitrineStock(JSON.parse(register.stock_system), vitrineStockItems)
          : null,
        stock_end_actual: register.stock_end_actual
          ? normalizeVitrineStock(JSON.parse(register.stock_end_actual), vitrineStockItems)
          : null,
        total_sales: salesResult.total_sales,
        order_count: salesResult.order_count,
      },
      bakeryProducts: vitrineStockItems.map((item) => item.label),
      vitrineStockItems,
      // Estimated closing values: opening amount plus paid sales by method
      estimatedCash: cashEnd,
      estimatedBank: bankEnd,
      dailyClosedSales: dailyClosed.total_sales,
      dailyClosedOrderCount: dailyClosed.order_count,
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

      // Use Argentina timezone to match orders.created_at (also stored via getLocalTimestamp)
      const opened_at = getLocalTimestamp();
      const date = opened_at.split(" ")[0];

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

      // Convert ISO opened_at to SQLite-compatible format
      const openedAtSqlite = register.opened_at.replace("T", " ").replace("Z", "").replace(/\.\d{3}/, "");

      const vitrineStockItems = VitrineStockModel.getActive();
      const stockStart = normalizeVitrineStock(
        JSON.parse(register.stock_start || "{}"),
        vitrineStockItems,
      );
      const { cashEnd, bankEnd } = calculateClosingAmounts(register);
      const stockSystem = calculateVitrineStockSystem(
        stockStart,
        vitrineStockItems,
        openedAtSqlite,
      );

      // Calculate total sales and order count
      const salesResult = getCollectedSalesSince(openedAtSqlite);

      const closed_at = getLocalTimestamp();

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
        cashEnd,
        bankEnd,
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
        stock_start: normalizeVitrineStock(
          JSON.parse(updated.stock_start || "{}"),
          vitrineStockItems,
        ),
        stock_system: normalizeVitrineStock(
          JSON.parse(updated.stock_system || "{}"),
          vitrineStockItems,
        ),
        stock_end_actual: normalizeVitrineStock(
          JSON.parse(updated.stock_end_actual || "{}"),
          vitrineStockItems,
        ),
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
    const vitrineStockItems = VitrineStockModel.getActive();
    const register = db
      .prepare(
        `SELECT * FROM cash_register_shifts WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1`
      )
      .get() as CashRegisterShift | undefined;

    if (!register) {
      const stock: Record<string, number> = {};
      for (const item of vitrineStockItems) {
        stock[getVitrineStockKey(item)] = 0;
      }
      return stock;
    }

    const openedAtSqlite = register.opened_at.replace("T", " ").replace("Z", "").replace(/\.\d{3}/, "");
    const stockStart = normalizeVitrineStock(
      JSON.parse(register.stock_start || "{}"),
      vitrineStockItems,
    );

    return calculateVitrineStockSystem(
      stockStart,
      vitrineStockItems,
      openedAtSqlite,
    );
  },
};
