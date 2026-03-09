import db from "../db.ts";

export interface Service {
  id: number;
  name: string;
  monthly_amount: number;
  due_day: number;
  category: string;
  icon: string;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePayment {
  id: number;
  service_id: number;
  month: number;
  year: number;
  amount_paid: number;
  payment_date: string;
  notes: string;
  created_at?: string;
}

export interface ServiceWithPayment extends Service {
  payment_id: number | null;
  amount_paid: number | null;
  payment_date: string | null;
  payment_notes: string | null;
}

export const ServiceModel = {
  // ─── Service CRUD ───

  getAll: (): Service[] => {
    return db
      .prepare(`SELECT * FROM services ORDER BY name ASC`)
      .all() as Service[];
  },

  getActive: (): Service[] => {
    return db
      .prepare(`SELECT * FROM services WHERE active = 1 ORDER BY name ASC`)
      .all() as Service[];
  },

  getById: (id: number): Service | undefined => {
    return db
      .prepare(`SELECT * FROM services WHERE id = ?`)
      .get(id) as Service | undefined;
  },

  create: (data: {
    name: string;
    monthly_amount: number;
    due_day: number;
    category: string;
    icon: string;
  }) => {
    const result = db
      .prepare(
        `INSERT INTO services (name, monthly_amount, due_day, category, icon)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(data.name, data.monthly_amount, data.due_day, data.category, data.icon);
    return { id: result.lastInsertRowid, ...data, active: 1 };
  },

  update: (
    id: number,
    data: Partial<{
      name: string;
      monthly_amount: number;
      due_day: number;
      category: string;
      icon: string;
      active: number;
    }>
  ) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.monthly_amount !== undefined) { fields.push("monthly_amount = ?"); values.push(data.monthly_amount); }
    if (data.due_day !== undefined) { fields.push("due_day = ?"); values.push(data.due_day); }
    if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
    if (data.icon !== undefined) { fields.push("icon = ?"); values.push(data.icon); }
    if (data.active !== undefined) { fields.push("active = ?"); values.push(data.active); }

    if (fields.length === 0) return { changes: 0 };

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    return db
      .prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);
  },

  delete: (id: number) => {
    return db.prepare(`DELETE FROM services WHERE id = ?`).run(id);
  },

  toggleActive: (id: number, active: number) => {
    return db
      .prepare(`UPDATE services SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(active, id);
  },

  // ─── Payments ───

  getPaymentsForMonth: (month: number, year: number): ServiceWithPayment[] => {
    return db
      .prepare(
        `SELECT s.*,
                sp.id as payment_id,
                sp.amount_paid,
                sp.payment_date,
                sp.notes as payment_notes
         FROM services s
         LEFT JOIN service_payments sp
           ON sp.service_id = s.id AND sp.month = ? AND sp.year = ?
         WHERE s.active = 1
         ORDER BY s.due_day ASC, s.name ASC`
      )
      .all(month, year) as ServiceWithPayment[];
  },

  addPayment: (data: {
    service_id: number;
    month: number;
    year: number;
    amount_paid: number;
    payment_date: string;
    notes?: string;
  }) => {
    const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // If a payment already exists for this service+month+year, delete its linked expense first
    const existing = db
      .prepare(`SELECT id FROM service_payments WHERE service_id = ? AND month = ? AND year = ?`)
      .get(data.service_id, data.month, data.year) as { id: number } | undefined;
    if (existing) {
      db.prepare(`DELETE FROM report_expenses WHERE service_payment_id = ?`).run(existing.id);
    }

    // Insert or replace the service payment
    const result = db
      .prepare(
        `INSERT OR REPLACE INTO service_payments (service_id, month, year, amount_paid, payment_date, notes)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.service_id,
        data.month,
        data.year,
        data.amount_paid,
        data.payment_date,
        data.notes || ""
      );

    const paymentId = result.lastInsertRowid;

    // Create a linked expense in report_expenses
    const service = db
      .prepare(`SELECT name FROM services WHERE id = ?`)
      .get(data.service_id) as { name: string } | undefined;
    const serviceName = service?.name || "Servicio";
    const description = `${serviceName} - ${MONTH_NAMES[data.month - 1]} ${data.year}`;

    db.prepare(
      `INSERT INTO report_expenses (amount, category, description, date, service_payment_id)
       VALUES (?, 'servicios', ?, ?, ?)`
    ).run(data.amount_paid, description, data.payment_date, paymentId);

    return { id: paymentId, ...data };
  },

  deletePayment: (id: number) => {
    // Delete linked expense first, then the payment
    db.prepare(`DELETE FROM report_expenses WHERE service_payment_id = ?`).run(id);
    return db.prepare(`DELETE FROM service_payments WHERE id = ?`).run(id);
  },

  getPaymentHistory: (serviceId: number, limit: number = 12): ServicePayment[] => {
    return db
      .prepare(
        `SELECT * FROM service_payments
         WHERE service_id = ?
         ORDER BY year DESC, month DESC
         LIMIT ?`
      )
      .all(serviceId, limit) as ServicePayment[];
  },

  // ─── Summaries ───

  getMonthlySummary: (month: number, year: number) => {
    const row = db
      .prepare(
        `SELECT
           COUNT(*) as active_count,
           COALESCE(SUM(s.monthly_amount), 0) as total_expected,
           COALESCE(SUM(CASE WHEN sp.id IS NOT NULL THEN sp.amount_paid ELSE 0 END), 0) as total_paid,
           COUNT(sp.id) as paid_count
         FROM services s
         LEFT JOIN service_payments sp
           ON sp.service_id = s.id AND sp.month = ? AND sp.year = ?
         WHERE s.active = 1`
      )
      .get(month, year) as {
      active_count: number;
      total_expected: number;
      total_paid: number;
      paid_count: number;
    };

    return {
      activeCount: row.active_count,
      totalExpected: row.total_expected,
      totalPaid: row.total_paid,
      paidCount: row.paid_count,
      pendingCount: row.active_count - row.paid_count,
    };
  },

  getAnnualSummary: (year: number) => {
    const months: Array<{
      month: number;
      totalExpected: number;
      totalPaid: number;
      paidCount: number;
      activeCount: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      const row = db
        .prepare(
          `SELECT
             COUNT(*) as active_count,
             COALESCE(SUM(s.monthly_amount), 0) as total_expected,
             COALESCE(SUM(CASE WHEN sp.id IS NOT NULL THEN sp.amount_paid ELSE 0 END), 0) as total_paid,
             COUNT(sp.id) as paid_count
           FROM services s
           LEFT JOIN service_payments sp
             ON sp.service_id = s.id AND sp.month = ? AND sp.year = ?
           WHERE s.active = 1`
        )
        .get(m, year) as {
        active_count: number;
        total_expected: number;
        total_paid: number;
        paid_count: number;
      };

      months.push({
        month: m,
        totalExpected: row.total_expected,
        totalPaid: row.total_paid,
        paidCount: row.paid_count,
        activeCount: row.active_count,
      });
    }

    return months;
  },
};
