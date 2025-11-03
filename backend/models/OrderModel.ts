import db from "../db.ts";

export interface Order {
  id?: number;
  table_number: number;
  shift: 'morning' | 'afternoon';
  status?: 'pending' | 'completed' | 'cancelled';
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
    console.log("Creating order:", orderData.table_number, "with items:", items);

    return db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (
          table_number, shift, status, discount_percentage, 
          total_amount, payment_method_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderData.table_number,
        orderData.shift,
        orderData.status || 'open',
        orderData.discount_percentage || 0,
        orderData.total_amount,
        orderData.payment_method_id,
        orderData.notes
      );

      const orderId = result.lastInsertRowid;

      items.forEach(item => {
        db.prepare(`
          INSERT INTO order_items (
            order_id, menu_item_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        );
      });

      return orderId;
    })();
  },

  getAll: () => {
    return db.prepare(`
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
      WHERE o.status = 'open'
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();
  },

  getById: (id: number) => {
    return db.prepare(`
      SELECT o.*, json_group_array(
        json_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal
        )
      ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.table_number = ?
      GROUP BY o.id
    `).get(id);
  },

  updateStatus: (id: number, status: string) => {
    return db.prepare(`
      UPDATE orders SET status = ? WHERE id = ?
    `).run(status, id);
  }
};