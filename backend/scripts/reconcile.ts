import db from "../db.ts";
const scalar = (sql: string) =>
  (db.prepare(sql).get() as Record<string, number>).value;
const report = {
  generated_at: new Date().toISOString(),
  local: {
    orders: scalar("select count(*) value from orders"),
    paid_sales: scalar(
      "select coalesce(sum(total_amount),0) value from orders where status='paid'",
    ),
    expenses: scalar(
      "select coalesce(sum(amount),0) value from report_expenses",
    ),
    cash_shifts: scalar("select count(*) value from cash_register_shifts"),
    cash_sales: scalar(
      "select coalesce(sum(total_sales),0) value from cash_register_shifts where status='closed'",
    ),
    stock_products: scalar("select count(*) value from stock_products"),
    stock_movements: scalar("select count(*) value from stock_movements"),
  },
  sync: {
    pending: scalar(
      "select count(*) value from sync_outbox where synced_at is null",
    ),
    dead_letters: scalar("select count(*) value from sync_dead_letter"),
  },
};
console.log(JSON.stringify(report, null, 2));
