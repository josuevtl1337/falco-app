import db, { getLocalTimestamp } from "../db.ts";
import { StockModel } from "./StockModel.ts";

export interface CustomerInput {
  name: string;
  phone?: string;
  notes?: string;
}

export interface AccountPaymentInput {
  customer_id: number;
  payment_method_id: number;
  amount_paid: number;
  discount_amount?: number;
  discount_percentage?: number;
  payment_date?: string;
  notes?: string;
}

function parseOrderItems(items: string | null) {
  if (!items) return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed)
      ? parsed.filter((item) => item.menu_item_id !== null)
      : [];
  } catch {
    return [];
  }
}

function getAccountPaymentMethodId() {
  const method = db
    .prepare(
      `SELECT id FROM payment_methods
       WHERE code = 'account' OR name = 'Cuenta corriente'
       ORDER BY id ASC
       LIMIT 1`
    )
    .get() as { id: number } | undefined;

  if (method) return method.id;

  const result = db
    .prepare(`INSERT INTO payment_methods (name, code) VALUES ('Cuenta corriente', 'account')`)
    .run();
  return Number(result.lastInsertRowid);
}

export const CustomerModel = {
  list: () => {
    return db
      .prepare(
        `SELECT
           c.*,
           COALESCE(charges.total_charged, 0) AS total_charged,
           COALESCE(payments.total_paid, 0) AS total_paid,
           COALESCE(payments.total_discount, 0) AS total_discount,
           COALESCE(charges.total_charged, 0)
             - COALESCE(payments.total_paid, 0)
             - COALESCE(payments.total_discount, 0) AS balance,
           COALESCE(charges.order_count, 0) AS order_count,
           charges.last_order_at
         FROM customers c
         LEFT JOIN (
           SELECT
             customer_id,
             COALESCE(SUM(total_amount), 0) AS total_charged,
             COUNT(*) AS order_count,
             MAX(created_at) AS last_order_at
           FROM orders
           WHERE customer_id IS NOT NULL
             AND status IN ('debt', 'paid')
           GROUP BY customer_id
         ) charges ON charges.customer_id = c.id
         LEFT JOIN (
           SELECT
             customer_id,
             COALESCE(SUM(amount_paid), 0) AS total_paid,
             COALESCE(SUM(discount_amount), 0) AS total_discount
           FROM customer_account_payments
           GROUP BY customer_id
         ) payments ON payments.customer_id = c.id
         WHERE c.active = 1
         ORDER BY balance DESC, c.name ASC`
      )
      .all();
  },

  create: (customer: CustomerInput) => {
    const name = customer.name?.trim();
    if (!name) throw new Error("El nombre del cliente es obligatorio");

    const result = db
      .prepare(
        `INSERT INTO customers (name, phone, notes, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(name, customer.phone || "", customer.notes || "", getLocalTimestamp());

    return CustomerModel.getById(Number(result.lastInsertRowid));
  },

  update: (id: number, customer: CustomerInput) => {
    const name = customer.name?.trim();
    if (!name) throw new Error("El nombre del cliente es obligatorio");

    db.prepare(
      `UPDATE customers
       SET name = ?, phone = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    ).run(name, customer.phone || "", customer.notes || "", getLocalTimestamp(), id);

    return CustomerModel.getById(id);
  },

  getById: (id: number) => {
    return db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
  },

  getDetail: (id: number, month?: number, year?: number) => {
    const customer = CustomerModel.getById(id);
    if (!customer) throw new Error("Cliente no encontrado");

    const dateClause = month && year ? "AND strftime('%m', o.created_at) = ? AND strftime('%Y', o.created_at) = ?" : "";
    const params: any[] = [id];
    if (month && year) {
      params.push(String(month).padStart(2, "0"), String(year));
    }

    const charges = db
      .prepare(
        `SELECT
           o.*,
           pm.name AS payment_method_name,
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
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
         LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
         WHERE o.customer_id = ?
           AND o.status IN ('debt', 'paid')
           ${dateClause}
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      )
      .all(...params)
      .map((order: any) => ({ ...order, items: parseOrderItems(order.items) }));

    const paymentDateClause = month && year ? "AND strftime('%m', cap.payment_date) = ? AND strftime('%Y', cap.payment_date) = ?" : "";
    const paymentParams: any[] = [id];
    if (month && year) {
      paymentParams.push(String(month).padStart(2, "0"), String(year));
    }

    const payments = db
      .prepare(
        `SELECT cap.*, pm.name AS payment_method_name, pm.code AS payment_method_code
         FROM customer_account_payments cap
         LEFT JOIN payment_methods pm ON pm.id = cap.payment_method_id
         WHERE cap.customer_id = ?
           ${paymentDateClause}
         ORDER BY cap.payment_date DESC, cap.created_at DESC`
      )
      .all(...paymentParams);

    const totals = db
      .prepare(
        `SELECT
           COALESCE((SELECT SUM(total_amount) FROM orders WHERE customer_id = ? AND status IN ('debt', 'paid')), 0) AS total_charged,
           COALESCE((SELECT SUM(amount_paid) FROM customer_account_payments WHERE customer_id = ?), 0) AS total_paid,
           COALESCE((SELECT SUM(discount_amount) FROM customer_account_payments WHERE customer_id = ?), 0) AS total_discount`
      )
      .get(id, id, id) as { total_charged: number; total_paid: number; total_discount: number };

    const period = {
      charged: charges.reduce((acc: number, order: any) => acc + Number(order.total_amount || 0), 0),
      paid: payments.reduce((acc: number, payment: any) => acc + Number(payment.amount_paid || 0), 0),
      discount: payments.reduce((acc: number, payment: any) => acc + Number(payment.discount_amount || 0), 0),
    };

    return {
      customer,
      charges,
      payments,
      period: {
        ...period,
        balance: period.charged - period.paid - period.discount,
      },
      balance:
        Number(totals.total_charged || 0) -
        Number(totals.total_paid || 0) -
        Number(totals.total_discount || 0),
      totals,
    };
  },

  assignOrder: (orderId: number, customerId: number) => {
    return db.transaction(() => {
      const customer = db
        .prepare(`SELECT id FROM customers WHERE id = ? AND active = 1`)
        .get(customerId);
      if (!customer) throw new Error("Cliente no encontrado");

      const order = db
        .prepare(`SELECT * FROM orders WHERE id = ?`)
        .get(orderId) as { id: number; status: string } | undefined;
      if (!order) throw new Error("Comanda no encontrada");
      if (order.status !== "open") {
        throw new Error("Solo se pueden asignar comandas abiertas");
      }

      const accountMethodId = getAccountPaymentMethodId();
      StockModel.deductStockForOrder(orderId);
      db.prepare(
        `UPDATE orders
         SET status = 'debt',
             payment_method_id = ?,
             customer_id = ?,
             discount_percentage = 0
         WHERE id = ?`
      ).run(accountMethodId, customerId, orderId);

      return CustomerModel.getDetail(customerId);
    })();
  },

  registerPayment: (payment: AccountPaymentInput) => {
    if (!payment.customer_id) throw new Error("Cliente requerido");
    if (!payment.payment_method_id) throw new Error("Metodo de pago requerido");
    if (Number(payment.amount_paid || 0) < 0) throw new Error("El pago no puede ser negativo");
    if (Number(payment.discount_amount || 0) < 0) throw new Error("El descuento no puede ser negativo");

    return db.transaction(() => {
      const paymentDate = payment.payment_date || getLocalTimestamp().split(" ")[0];
      const result = db
        .prepare(
          `INSERT INTO customer_account_payments (
             customer_id, payment_method_id, amount_paid, discount_amount,
             discount_percentage, payment_date, notes, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          payment.customer_id,
          payment.payment_method_id,
          payment.amount_paid,
          payment.discount_amount || 0,
          payment.discount_percentage || 0,
          paymentDate,
          payment.notes || "",
          getLocalTimestamp()
        );

      const totals = db
        .prepare(
          `SELECT
             COALESCE((SELECT SUM(total_amount) FROM orders WHERE customer_id = ? AND status IN ('debt', 'paid')), 0) AS total_charged,
             COALESCE((SELECT SUM(amount_paid) FROM customer_account_payments WHERE customer_id = ?), 0) AS total_paid,
             COALESCE((SELECT SUM(discount_amount) FROM customer_account_payments WHERE customer_id = ?), 0) AS total_discount`
        )
        .get(payment.customer_id, payment.customer_id, payment.customer_id) as {
        total_charged: number;
        total_paid: number;
        total_discount: number;
      };

      const remainingBalance =
        Number(totals.total_charged || 0) -
        Number(totals.total_paid || 0) -
        Number(totals.total_discount || 0);

      if (remainingBalance <= 0.01) {
        db.prepare(
          `UPDATE orders
           SET status = 'paid'
           WHERE customer_id = ?
             AND status = 'debt'`
        ).run(payment.customer_id);
      }

      return {
        paymentId: result.lastInsertRowid,
        detail: CustomerModel.getDetail(payment.customer_id),
      };
    })();
  },
};
