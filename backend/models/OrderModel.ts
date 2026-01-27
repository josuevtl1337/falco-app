import db from "../db.ts";
import StockModel from "./StockModel.ts";

export interface Order {
  id?: number;
  table_number: string;
  shift: "morning" | "afternoon";
  status?: "open" | "paid" | "cancelled";
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

  getHistory: (filters: { date?: string } = {}) => {
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
      // SQLite date function to match YYYY-MM-DD
      query += " AND date(o.created_at) = ?";
      params.push(filters.date);
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
    // Si se está marcando como pagado, validar y descontar stock
    if (order.status === "paid" && order.id) {
      // Obtener items de la orden para validar stock
      const orderItems = db
        .prepare(
          `SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?`
        )
        .all(order.id) as Array<{ menu_item_id: number; quantity: number }>;

      // Validar stock
      const validation = StockModel.validateStockForOrder(orderItems);
      if (!validation.valid) {
        const insufficientList = validation.insufficientItems
          .map(
            (item) =>
              `${item.name}: necesario ${item.required}${item.unit}, disponible ${item.available}${item.unit}`
          )
          .join(", ");
        throw new Error(`Stock insuficiente: ${insufficientList}`);
      }

      // Descontar stock en transacción
      return db.transaction(() => {
        // Actualizar estado de la orden
        db.prepare(
          `
          UPDATE orders SET
            status = ?,
            payment_method_id = ?,
            discount_percentage = ?,
            total_amount = ?
          WHERE id = ?
        `
        ).run(
          order.status,
          order.payment_method_id,
          order.discount_percentage,
          order.total_amount,
          order.id
        );

        // Descontar stock
        StockModel.deductStockForOrder(order.id!, orderItems);

        return { changes: 1 };
      })();
    }

    // Si no es pago, solo actualizar estado
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

  getPaymentMethods: () => {
    return db.prepare(`SELECT * FROM payment_methods`).all();
  },
};
