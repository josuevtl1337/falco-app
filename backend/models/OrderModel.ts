import db from "../db.ts";

export interface Order {
  id?: number;
  table_number: number;
  shift: "morning" | "afternoon";
  status?: "pending" | "completed" | "cancelled";
  discount_percentage?: number;
  total_amount: number;
  payment_method_id?: number;
  notes?: string;
  items: OrderItem[];
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const OrderModel = {
  create: (order: Order) => {
    const { items, ...orderData } = order;

    return db.transaction(() => {
      const result = db
        .prepare(
          `
        INSERT INTO orders (
          table_number, shift, status, discount_percentage, 
          total_amount, payment_method_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          orderData.table_number,
          orderData.shift,
          orderData.status || "open",
          orderData.discount_percentage || 0,
          orderData.total_amount,
          orderData.payment_method_id,
          orderData.notes
        );

      const orderId = result.lastInsertRowid;

      items.forEach((item) => {
        db.prepare(
          `
          INSERT INTO order_items (
            order_id, menu_item_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `
        ).run(
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        );
      });

      const row = db
        .prepare(
          `
        SELECT
          o.*,
          json_group_array(
            json_object(
              'menu_item_id', oi.menu_item_id,
              'menu_item_name', mi.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal
            )
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE o.id = ?
        GROUP BY o.id
      `
        )
        .get(orderId);

      // parsear y normalizar items
      let parsedItems: any[] = [];
      if (row && row.items && typeof row.items === "string") {
        try {
          const parsed = JSON.parse(row.items);
          if (Array.isArray(parsed)) {
            parsedItems = parsed.map((it: any) => ({
              product_id: Number(it.menu_item_id ?? it.product_id ?? it.menu_item),
              name: it.menu_item_name ?? it.name ?? null,
              quantity: Number(it.quantity ?? 0),
              unit_price: Number(it.unit_price ?? 0),
              subtotal: Number(it.subtotal ?? 0),
            }));
          }
        } catch (e) {
          parsedItems = [];
        }
      }

      return {
        ...row,
        items: parsedItems,
      };
    })();
  },

  getAll: () => {
    const orders: any[] = db
      .prepare(
        `
       SELECT
         o.*,
         json_group_array(
           json_object(
             'menu_item_id', oi.menu_item_id,
             'menu_item_name', mi.name,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'subtotal', oi.subtotal
           )
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE o.status = 'open'
       GROUP BY o.id
       ORDER BY o.created_at DESC
     `
      )
      .all();

    const parsedOrders = orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
    }));

    return parsedOrders;
  },

  getById: (id: number) => {
    return db
      .prepare(
        `
      SELECT o.*, json_group_array(
        json_object(
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.table_number = ?
      GROUP BY o.id
    `
      )
      .get(id);
  },

  updateStatus: (order: Order) => {
    return db
      .prepare(
        `
      UPDATE orders SET
        status = ?,
        payment_method_id = ?,
        discount_percentage = ?,
        total_amount = ?
      WHERE id = ?
    `
      )
      .run(order.status, order.payment_method_id, order.discount_percentage, order.total_amount, order.id);
  },

  updateOrder: (order: Order) => {
    const { items, id, ...orderData } = order;
    if (!id) throw new Error("Order ID is required for update");
    return db.transaction(() => {
      db
        .prepare(
          `
        UPDATE orders SET
          table_number = ?,
          shift = ?,
          status = ?,
          discount_percentage = ?,
          total_amount = ?,
          payment_method_id = ?,
          notes = ?
        WHERE id = ?
      `
        )
        .run(
          orderData.table_number,
          orderData.shift,
          orderData.status,
          orderData.discount_percentage || 0,
          orderData.total_amount,
          orderData.payment_method_id,
          orderData.notes,
          id
        );
      db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(id);

      items.forEach((item) => {
        db.prepare(
          `
          INSERT INTO order_items (
            order_id, menu_item_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `
        ).run(
          id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        );
      });

      return OrderModel.getById(id);
    })();
  },

  getPaymentMethods: () => {
    return db.prepare(`SELECT * FROM payment_methods`).all();
  }
};
