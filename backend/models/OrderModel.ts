import db, { getLocalTimestamp } from "../db.ts";
import { StockModel } from "./StockModel.ts";

export interface Order {
  id?: number;
  table_number: string;
  shift: "morning" | "afternoon";
  status?: "open" | "debt" | "paid" | "cancelled";
  discount_percentage?: number;
  total_amount: number;
  payment_method_id?: number;
  notes?: string;
  items: OrderItem[];
}

export interface OrderItem {
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PartialPaymentInput {
  payment_method_id: number;
  discount_percentage?: number;
  total_amount: number;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

function parseOrderRow(row: any) {
  if (!row) return null;
  return {
    ...row,
    items: JSON.parse(row.items || "[]").filter(
      (item: OrderItem) => item.menu_item_id !== null,
    ),
  };
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
          total_amount, payment_method_id, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          orderData.table_number,
          orderData.shift,
          orderData.status || "open",
          orderData.discount_percentage || 0,
          orderData.total_amount,
          orderData.payment_method_id,
          orderData.notes,
          getLocalTimestamp()
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
          item.menu_item_id,
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
      let parsedItems: OrderItem[] = [];
      if (row && row.items && typeof row.items === "string") {
        try {
          const parsed = JSON.parse(row.items);
          if (Array.isArray(parsed)) {
            parsedItems = parsed.map((it: OrderItem) => ({
              menu_item_id: Number(it.menu_item_id ?? 0),
              menu_item_name: it.menu_item_name,
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

  getHistory: (filters: { date?: string; from?: string; to?: string; shift?: string } = {}) => {
    let query = `
       SELECT
         o.*,
         pm.name as payment_method_name,
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
       LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
       WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.date) {
      query += " AND date(o.created_at) = ?";
      params.push(filters.date);
    } else if (filters.from && filters.to) {
      query += " AND date(o.created_at) BETWEEN ? AND ?";
      params.push(filters.from, filters.to);
    }

    if (filters.shift && filters.shift !== "both") {
      query += " AND o.shift = ?";
      params.push(filters.shift);
    }

    query += `
       GROUP BY o.id
       ORDER BY o.created_at DESC
    `;

    const orders: any[] = db.prepare(query).all(...params);

    return orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
    }));
  },

  getById: (id: number) => {
    const row = db
      .prepare(
        `
      SELECT o.*,
        json_group_array(
          json_object(
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.id = ?
      GROUP BY o.id
    `
      )
      .get(id);
    return parseOrderRow(row);
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
      .run(
        order.status,
        order.payment_method_id,
        order.discount_percentage,
        order.total_amount,
        order.id
      );
  },

  updateOrder: (order: Order) => {
    const { items, id } = order;
    if (!id) throw new Error("Order ID is required for update");
    return db.transaction(() => {

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
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        );
      });

      return OrderModel.getById(id);
    })();
  },

  payPartial: (orderId: number, payment: PartialPaymentInput) => {
    if (!payment.items.length) {
      throw new Error("Selecciona al menos un item para cobrar");
    }

    return db.transaction(() => {
      const order = db
        .prepare(`SELECT * FROM orders WHERE id = ?`)
        .get(orderId) as Order | undefined;

      if (!order) throw new Error("Comanda no encontrada");
      if (order.status !== "open") {
        throw new Error("Solo se pueden dividir comandas abiertas");
      }

      const originalItems = db
        .prepare(
          `SELECT oi.*, mi.name as menu_item_name
           FROM order_items oi
           LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
           WHERE oi.order_id = ?`
        )
        .all(orderId) as OrderItem[];

      const originalByMenuItem = new Map(
        originalItems.map((item) => [Number(item.menu_item_id), item]),
      );

      for (const item of payment.items) {
        const original = originalByMenuItem.get(Number(item.menu_item_id));
        if (!original) {
          throw new Error("Uno de los items no pertenece a la comanda");
        }
        if (Number(item.quantity) <= 0 || Number(item.quantity) > Number(original.quantity)) {
          throw new Error(`Cantidad invalida para ${original.menu_item_name}`);
        }
      }

      const paidOrderResult = db
        .prepare(
          `INSERT INTO orders (
             table_number, shift, status, discount_percentage,
             total_amount, payment_method_id, notes, created_at
           ) VALUES (?, ?, 'paid', ?, ?, ?, ?, ?)`
        )
        .run(
          order.table_number,
          order.shift,
          payment.discount_percentage || 0,
          payment.total_amount,
          payment.payment_method_id,
          `Subcuenta de orden #${orderId}`,
          getLocalTimestamp(),
        );

      const paidOrderId = Number(paidOrderResult.lastInsertRowid);

      for (const item of payment.items) {
        db.prepare(
          `INSERT INTO order_items (
             order_id, menu_item_id, quantity, unit_price, subtotal
           ) VALUES (?, ?, ?, ?, ?)`
        ).run(
          paidOrderId,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
        );
      }

      StockModel.deductStockForOrder(paidOrderId);

      let remainingTotal = 0;

      for (const original of originalItems) {
        const selected = payment.items.find(
          (item) => Number(item.menu_item_id) === Number(original.menu_item_id),
        );
        const selectedQty = Number(selected?.quantity || 0);
        const remainingQty = Number(original.quantity) - selectedQty;

        if (remainingQty <= 0) {
          db.prepare(`DELETE FROM order_items WHERE order_id = ? AND menu_item_id = ?`).run(
            orderId,
            original.menu_item_id,
          );
          continue;
        }

        const remainingSubtotal = remainingQty * Number(original.unit_price);
        remainingTotal += remainingSubtotal;
        db.prepare(
          `UPDATE order_items
           SET quantity = ?, subtotal = ?
           WHERE order_id = ? AND menu_item_id = ?`
        ).run(remainingQty, remainingSubtotal, orderId, original.menu_item_id);
      }

      if (remainingTotal <= 0) {
        db.prepare(
          `UPDATE orders
           SET status = 'cancelled',
               total_amount = 0
           WHERE id = ?`
        ).run(orderId);
      } else {
        db.prepare(
          `UPDATE orders
           SET total_amount = ?
           WHERE id = ?`
        ).run(remainingTotal, orderId);
      }

      return {
        paidOrder: OrderModel.getById(paidOrderId),
        remainingOrder: remainingTotal > 0 ? OrderModel.getById(orderId) : null,
      };
    })();
  },

  getPaymentMethods: () => {
    return db.prepare(`SELECT * FROM payment_methods`).all();
  },
};
