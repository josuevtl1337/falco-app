import db from "../db.ts";

export interface Installment {
  id: number;
  name: string;
  monthly_amount: number;
  due_day: number;
  total_months: number;
  start_month: number;
  start_year: number;
  category: string;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export interface InstallmentPayment {
  id: number;
  installment_id: number;
  month: number;
  year: number;
  installment_number: number;
  amount_paid: number;
  payment_date: string;
  notes: string;
  created_at?: string;
}

export interface InstallmentWithPayment extends Installment {
  installment_number: number;
  payment_id: number | null;
  amount_paid: number | null;
  payment_date: string | null;
  payment_notes: string | null;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const InstallmentModel = {
  getAll: (): Installment[] => {
    return db
      .prepare(`SELECT * FROM installments ORDER BY active DESC, start_year DESC, start_month DESC, name ASC`)
      .all() as Installment[];
  },

  getById: (id: number): Installment | undefined => {
    return db.prepare(`SELECT * FROM installments WHERE id = ?`).get(id) as Installment | undefined;
  },

  create: (data: {
    name: string;
    monthly_amount: number;
    due_day: number;
    total_months: number;
    start_month: number;
    start_year: number;
    category?: string;
  }) => {
    const result = db
      .prepare(
        `INSERT INTO installments (name, monthly_amount, due_day, total_months, start_month, start_year, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.name,
        data.monthly_amount,
        data.due_day,
        data.total_months,
        data.start_month,
        data.start_year,
        data.category || "cuotas"
      );

    return { id: result.lastInsertRowid, ...data, category: data.category || "cuotas", active: 1 };
  },

  update: (
    id: number,
    data: Partial<{
      name: string;
      monthly_amount: number;
      due_day: number;
      total_months: number;
      start_month: number;
      start_year: number;
      category: string;
      active: number;
    }>
  ) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.monthly_amount !== undefined) { fields.push("monthly_amount = ?"); values.push(data.monthly_amount); }
    if (data.due_day !== undefined) { fields.push("due_day = ?"); values.push(data.due_day); }
    if (data.total_months !== undefined) { fields.push("total_months = ?"); values.push(data.total_months); }
    if (data.start_month !== undefined) { fields.push("start_month = ?"); values.push(data.start_month); }
    if (data.start_year !== undefined) { fields.push("start_year = ?"); values.push(data.start_year); }
    if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }
    if (data.active !== undefined) { fields.push("active = ?"); values.push(data.active); }

    if (fields.length === 0) return { changes: 0 };

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    return db.prepare(`UPDATE installments SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },

  delete: (id: number) => {
    return db.transaction(() => {
      db.prepare(
        `DELETE FROM report_expenses
         WHERE installment_payment_id IN (
           SELECT id FROM installment_payments WHERE installment_id = ?
         )`
      ).run(id);

      db.prepare(`DELETE FROM installment_payments WHERE installment_id = ?`).run(id);

      return db.prepare(`DELETE FROM installments WHERE id = ?`).run(id);
    })();
  },

  getPaymentsForMonth: (month: number, year: number): InstallmentWithPayment[] => {
    return db
      .prepare(
        `SELECT i.*,
                ((? - i.start_year) * 12 + (? - i.start_month) + 1) as installment_number,
                ip.id as payment_id,
                ip.amount_paid,
                ip.payment_date,
                ip.notes as payment_notes
         FROM installments i
         LEFT JOIN installment_payments ip
           ON ip.installment_id = i.id AND ip.month = ? AND ip.year = ?
         WHERE i.active = 1
           AND ((? - i.start_year) * 12 + (? - i.start_month) + 1) BETWEEN 1 AND i.total_months
         ORDER BY i.due_day ASC, i.name ASC`
      )
      .all(year, month, month, year, year, month) as InstallmentWithPayment[];
  },

  addPayment: (data: {
    installment_id: number;
    month: number;
    year: number;
    amount_paid: number;
    payment_date: string;
    notes?: string;
  }) => {
    const installment = db
      .prepare(
        `SELECT *,
                ((? - start_year) * 12 + (? - start_month) + 1) as installment_number
         FROM installments
         WHERE id = ?`
      )
      .get(data.year, data.month, data.installment_id) as (Installment & { installment_number: number }) | undefined;

    if (!installment) {
      throw new Error("Cuota no encontrada");
    }
    if (installment.installment_number < 1 || installment.installment_number > installment.total_months) {
      throw new Error("La cuota no corresponde al periodo seleccionado");
    }

    const existing = db
      .prepare(`SELECT id FROM installment_payments WHERE installment_id = ? AND month = ? AND year = ?`)
      .get(data.installment_id, data.month, data.year) as { id: number } | undefined;
    if (existing) {
      db.prepare(`DELETE FROM report_expenses WHERE installment_payment_id = ?`).run(existing.id);
    }

    const result = db
      .prepare(
        `INSERT OR REPLACE INTO installment_payments
           (installment_id, month, year, installment_number, amount_paid, payment_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.installment_id,
        data.month,
        data.year,
        installment.installment_number,
        data.amount_paid,
        data.payment_date,
        data.notes || ""
      );

    const paymentId = result.lastInsertRowid;
    const description = `${installment.name} - cuota ${installment.installment_number}/${installment.total_months} - ${MONTH_NAMES[data.month - 1]} ${data.year}`;

    db.prepare(
      `INSERT INTO report_expenses (amount, category, description, date, installment_payment_id)
       VALUES (?, 'cuotas', ?, ?, ?)`
    ).run(data.amount_paid, description, data.payment_date, paymentId);

    return { id: paymentId, installment_number: installment.installment_number, ...data };
  },

  deletePayment: (id: number) => {
    db.prepare(`DELETE FROM report_expenses WHERE installment_payment_id = ?`).run(id);
    return db.prepare(`DELETE FROM installment_payments WHERE id = ?`).run(id);
  },

  getMonthlySummary: (month: number, year: number) => {
    const row = db
      .prepare(
        `SELECT
           COUNT(*) as active_count,
           COALESCE(SUM(i.monthly_amount), 0) as total_expected,
           COALESCE(SUM(CASE WHEN ip.id IS NOT NULL THEN ip.amount_paid ELSE 0 END), 0) as total_paid,
           COUNT(ip.id) as paid_count
         FROM installments i
         LEFT JOIN installment_payments ip
           ON ip.installment_id = i.id AND ip.month = ? AND ip.year = ?
         WHERE i.active = 1
           AND ((? - i.start_year) * 12 + (? - i.start_month) + 1) BETWEEN 1 AND i.total_months`
      )
      .get(month, year, year, month) as {
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
};
