import db from "../db.ts";

export interface VitrineStockItem {
  id: number;
  label: string;
  unit_step: number;
  show_on_open: number;
  show_on_close: number;
  active: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface VitrineStockMenuItemMap {
  id: number;
  vitrine_stock_item_id: number;
  menu_item_id: number;
  menu_item_name?: string;
  quantity_per_item: number;
}

export interface VitrineStockItemWithMappings extends VitrineStockItem {
  mappings: VitrineStockMenuItemMap[];
}

function getMappingsByItemId(vitrineStockItemId: number): VitrineStockMenuItemMap[] {
  return db
    .prepare(
      `SELECT vsim.*, mi.name as menu_item_name
       FROM cash_register_stock_item_menu_map vsim
       JOIN menu_items mi ON mi.id = vsim.menu_item_id
       WHERE vsim.vitrine_stock_item_id = ?
       ORDER BY mi.name ASC`
    )
    .all(vitrineStockItemId) as VitrineStockMenuItemMap[];
}

function withMappings(item: VitrineStockItem): VitrineStockItemWithMappings {
  return {
    ...item,
    mappings: getMappingsByItemId(item.id),
  };
}

export const VitrineStockModel = {
  getAll: (): VitrineStockItemWithMappings[] => {
    const items = db
      .prepare(
        `SELECT *
         FROM cash_register_stock_items
         ORDER BY sort_order ASC, label ASC`
      )
      .all() as VitrineStockItem[];

    return items.map(withMappings);
  },

  getActive: (): VitrineStockItemWithMappings[] => {
    const items = db
      .prepare(
        `SELECT *
         FROM cash_register_stock_items
         WHERE active = 1
         ORDER BY sort_order ASC, label ASC`
      )
      .all() as VitrineStockItem[];

    return items.map(withMappings);
  },

  create: (data: {
    label: string;
    unit_step?: number;
    show_on_open?: number;
    show_on_close?: number;
    sort_order?: number;
  }): VitrineStockItemWithMappings => {
    const result = db
      .prepare(
        `INSERT INTO cash_register_stock_items (
           label, unit_step, show_on_open, show_on_close, sort_order
         ) VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        data.label,
        data.unit_step ?? 1,
        data.show_on_open ?? 1,
        data.show_on_close ?? 1,
        data.sort_order ?? 0,
      );

    const item = db
      .prepare(`SELECT * FROM cash_register_stock_items WHERE id = ?`)
      .get(result.lastInsertRowid) as VitrineStockItem;

    return withMappings(item);
  },

  update: (
    id: number,
    data: {
      label: string;
      unit_step: number;
      show_on_open: number;
      show_on_close: number;
      sort_order: number;
    },
  ) => {
    return db
      .prepare(
        `UPDATE cash_register_stock_items
         SET label = ?,
             unit_step = ?,
             show_on_open = ?,
             show_on_close = ?,
             sort_order = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(
        data.label,
        data.unit_step,
        data.show_on_open ? 1 : 0,
        data.show_on_close ? 1 : 0,
        data.sort_order,
        id,
      );
  },

  toggleActive: (id: number, active: number) => {
    return db
      .prepare(
        `UPDATE cash_register_stock_items
         SET active = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(active ? 1 : 0, id);
  },

  getMappingsByItemId,

  setMappings: (
    vitrineStockItemId: number,
    mappings: Array<{ menu_item_id: number; quantity_per_item?: number }>,
  ) => {
    return db.transaction(() => {
      db.prepare(
        `DELETE FROM cash_register_stock_item_menu_map
         WHERE vitrine_stock_item_id = ?`
      ).run(vitrineStockItemId);

      const insert = db.prepare(
        `INSERT INTO cash_register_stock_item_menu_map (
           vitrine_stock_item_id, menu_item_id, quantity_per_item
         ) VALUES (?, ?, ?)`
      );

      for (const mapping of mappings) {
        insert.run(
          vitrineStockItemId,
          mapping.menu_item_id,
          mapping.quantity_per_item ?? 1,
        );
      }
    })();
  },

  getSoldQuantitiesSince: (openedAtSqlite: string): Map<number, number> => {
    const rows = db
      .prepare(
        `SELECT vsim.vitrine_stock_item_id as id,
                COALESCE(SUM(oi.quantity * vsim.quantity_per_item), 0) as total_sold
         FROM cash_register_stock_item_menu_map vsim
         JOIN cash_register_stock_items vsi ON vsi.id = vsim.vitrine_stock_item_id
         JOIN order_items oi ON oi.menu_item_id = vsim.menu_item_id
         JOIN orders o ON o.id = oi.order_id
         WHERE vsi.active = 1
           AND o.status = 'paid'
           AND o.created_at >= ?
         GROUP BY vsim.vitrine_stock_item_id`
      )
      .all(openedAtSqlite) as Array<{ id: number; total_sold: number }>;

    return new Map(rows.map((row) => [row.id, Number(row.total_sold || 0)]));
  },
};
