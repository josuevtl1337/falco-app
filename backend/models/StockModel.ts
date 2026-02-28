import db from "../db.ts";

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

export const StockModel = {
  // ─── Stock Products CRUD ───

  getAll: (): StockProduct[] => {
    return db
      .prepare(
        `SELECT * FROM stock_products ORDER BY name ASC`
      )
      .all() as StockProduct[];
  },

  getActive: (): StockProduct[] => {
    return db
      .prepare(
        `SELECT * FROM stock_products WHERE active = 1 ORDER BY name ASC`
      )
      .all() as StockProduct[];
  },

  getById: (id: number): StockProduct | undefined => {
    return db
      .prepare(`SELECT * FROM stock_products WHERE id = ?`)
      .get(id) as StockProduct | undefined;
  },

  create: (data: { name: string; current_stock: number; alert_threshold: number }) => {
    const result = db
      .prepare(
        `INSERT INTO stock_products (name, current_stock, alert_threshold)
         VALUES (?, ?, ?)`
      )
      .run(data.name, data.current_stock, data.alert_threshold);
    return { id: result.lastInsertRowid, ...data, active: 1 };
  },

  update: (id: number, data: { name: string; alert_threshold: number }) => {
    return db
      .prepare(
        `UPDATE stock_products
         SET name = ?, alert_threshold = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(data.name, data.alert_threshold, id);
  },

  toggleActive: (id: number, active: number) => {
    return db
      .prepare(
        `UPDATE stock_products SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .run(active, id);
  },

  // ─── Menu Item Mapping ───

  getMappingsByProductId: (stockProductId: number): StockMenuItemMap[] => {
    return db
      .prepare(
        `SELECT smi.*, mi.name as menu_item_name
         FROM stock_menu_item_map smi
         JOIN menu_items mi ON mi.id = smi.menu_item_id
         WHERE smi.stock_product_id = ?`
      )
      .all(stockProductId) as StockMenuItemMap[];
  },

  setMappings: (stockProductId: number, menuItemIds: number[]) => {
    return db.transaction(() => {
      db.prepare(`DELETE FROM stock_menu_item_map WHERE stock_product_id = ?`).run(
        stockProductId
      );

      const insert = db.prepare(
        `INSERT INTO stock_menu_item_map (stock_product_id, menu_item_id) VALUES (?, ?)`
      );
      for (const menuItemId of menuItemIds) {
        insert.run(stockProductId, menuItemId);
      }
    })();
  },

  // ─── Stock Replenishment ───

  replenish: (id: number, quantity: number) => {
    return db.transaction(() => {
      const product = db
        .prepare(`SELECT * FROM stock_products WHERE id = ?`)
        .get(id) as StockProduct | undefined;

      if (!product) throw new Error("Producto de stock no encontrado");

      const newStock = product.current_stock + quantity;

      db.prepare(
        `UPDATE stock_products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(newStock, id);

      db.prepare(
        `INSERT INTO stock_movements (stock_product_id, quantity_change, previous_stock, new_stock, reason)
         VALUES (?, ?, ?, ?, ?)`
      ).run(id, quantity, product.current_stock, newStock, "Reposición manual");

      return { ...product, current_stock: newStock };
    })();
  },

  // ─── Stock Deduction (called on order payment) ───

  deductStockForOrder: (orderId: number) => {
    return db.transaction(() => {
      // Get all order items
      const orderItems = db
        .prepare(
          `SELECT oi.menu_item_id, oi.quantity, mi.name as menu_item_name
           FROM order_items oi
           JOIN menu_items mi ON mi.id = oi.menu_item_id
           WHERE oi.order_id = ?`
        )
        .all(orderId) as Array<{
        menu_item_id: number;
        quantity: number;
        menu_item_name: string;
      }>;

      // Aggregate total quantity to deduct per stock product
      const aggregated = new Map<
        number,
        { name: string; current_stock: number; totalQty: number }
      >();

      for (const item of orderItems) {
        const mappings = db
          .prepare(
            `SELECT sp.id, sp.name, sp.current_stock
             FROM stock_menu_item_map smi
             JOIN stock_products sp ON sp.id = smi.stock_product_id
             WHERE smi.menu_item_id = ? AND sp.active = 1`
          )
          .all(item.menu_item_id) as Array<{
          id: number;
          name: string;
          current_stock: number;
        }>;

        for (const stockProduct of mappings) {
          const existing = aggregated.get(stockProduct.id);
          if (existing) {
            existing.totalQty += item.quantity;
          } else {
            aggregated.set(stockProduct.id, {
              name: stockProduct.name,
              current_stock: stockProduct.current_stock,
              totalQty: item.quantity,
            });
          }
        }
      }

      // Check all stock is sufficient before any deductions
      const insufficientItems: string[] = [];
      for (const [, entry] of aggregated) {
        if (entry.current_stock < entry.totalQty) {
          insufficientItems.push(
            `${entry.name} (disponible: ${entry.current_stock}, necesario: ${entry.totalQty})`
          );
        }
      }

      if (insufficientItems.length > 0) {
        throw new Error(
          `Stock insuficiente: ${insufficientItems.join(", ")}`
        );
      }

      // All stock is sufficient — perform deductions
      for (const [stockProductId, entry] of aggregated) {
        const newStock = entry.current_stock - entry.totalQty;

        db.prepare(
          `UPDATE stock_products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(newStock, stockProductId);

        db.prepare(
          `INSERT INTO stock_movements (stock_product_id, quantity_change, previous_stock, new_stock, reason, order_id)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          stockProductId,
          -entry.totalQty,
          entry.current_stock,
          newStock,
          `Orden #${orderId} pagada`,
          orderId
        );
      }

      return aggregated;
    })();
  },

  // ─── Low Stock Alerts ───

  getLowStockAlerts: (): LowStockAlert[] => {
    return db
      .prepare(
        `SELECT id, name, current_stock, alert_threshold
         FROM stock_products
         WHERE active = 1 AND current_stock <= alert_threshold
         ORDER BY (current_stock - alert_threshold) ASC`
      )
      .all() as LowStockAlert[];
  },

  // ─── Movement History ───

  getMovementsByProductId: (stockProductId: number): StockMovement[] => {
    return db
      .prepare(
        `SELECT sm.*, sp.name as stock_product_name
         FROM stock_movements sm
         JOIN stock_products sp ON sp.id = sm.stock_product_id
         WHERE sm.stock_product_id = ?
         ORDER BY sm.created_at DESC`
      )
      .all(stockProductId) as StockMovement[];
  },

  getAllMovements: (limit: number = 100): StockMovement[] => {
    return db
      .prepare(
        `SELECT sm.*, sp.name as stock_product_name
         FROM stock_movements sm
         JOIN stock_products sp ON sp.id = sm.stock_product_id
         ORDER BY sm.created_at DESC
         LIMIT ?`
      )
      .all(limit) as StockMovement[];
  },
};
