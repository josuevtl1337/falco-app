import db from "../db.ts";

class ReportModel {
  // =========================================
  // EXISTING — used by Resumen module
  // =========================================

  /**
   * Daily report: count, total, avg for a date (YYYY-MM-DD)
   */
  public static async getDailyReport(
    date: string,
    shift?: string
  ): Promise<{ count: number; total: number; avg: number }> {
    if (shift && shift !== "both") {
      const stmt = db.prepare(
        `SELECT 
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total,
            COALESCE(AVG(total_amount), 0) as avg
        FROM orders
        WHERE DATE(created_at) = ? AND shift = ? AND status = 'paid'`
      );
      const data = stmt.get(date, shift);
      return {
        count: data.count || 0,
        total: data.total || 0,
        avg: data.avg || 0,
      };
    }

    const data = db
      .prepare(
        `SELECT 
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total,
            COALESCE(AVG(total_amount), 0) as avg
        FROM orders
        WHERE DATE(created_at) = ? AND status = 'paid'`
      )
      .get(date);
    return {
      count: data.count || 0,
      total: data.total || 0,
      avg: data.avg || 0,
    };
  }

  public static getTotalForDate(date: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = ?`
      )
      .get(date);
    return row?.total ?? 0;
  }

  public static getTotalForRange(from: string, to: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN ? AND ?`
      )
      .get(from, to);
    return row?.total ?? 0;
  }

  public static getTotalsByShift(date: string): {
    morning: number;
    afternoon: number;
  } {
    const stmt = db.prepare(
      `SELECT shift, COALESCE(SUM(total_amount),0) as total FROM orders WHERE DATE(created_at) = ? GROUP BY shift`
    );
    const rows = stmt.all(date) as Array<{ shift: string; total: number }>;
    const res = { morning: 0, afternoon: 0 };
    for (const r of rows) {
      if (r.shift === "morning") res.morning = r.total;
      if (r.shift === "afternoon") res.afternoon = r.total;
    }
    return res;
  }

  // =========================================
  // NEW — Reportes module
  // =========================================

  /**
   * Monthly income from orders (paid) for a given month/year
   */
  public static getMonthlyIncome(
    month: number,
    year: number
  ): { total: number; count: number; avg: number } {
    const monthStr = String(month).padStart(2, "0");
    const datePattern = `${year}-${monthStr}%`;
    const data = db
      .prepare(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(AVG(total_amount), 0) as avg
        FROM orders
        WHERE LOWER(status) = 'paid'
          AND created_at LIKE ?`
      )
      .get(datePattern);
    return {
      total: data?.total || 0,
      count: data?.count || 0,
      avg: data?.avg || 0,
    };
  }

  /**
   * Income for a specific date range
   */
  public static getIncomeForRange(
    from: string,
    to: string
  ): { total: number; count: number; avg: number } {
    const data = db
      .prepare(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(AVG(total_amount), 0) as avg
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ?
          AND status = 'paid'`
      )
      .get(from, to);
    return {
      total: data?.total || 0,
      count: data?.count || 0,
      avg: data?.avg || 0,
    };
  }

  // ---- Report Expenses (new table) ----

  /**
   * Get all report expenses for a month/year
   */
  public static getMonthlyExpenses(month: number, year: number): any[] {
    const monthStr = String(month).padStart(2, "0");
    return db
      .prepare(
        `SELECT * FROM report_expenses
         WHERE strftime('%m', date) = ?
           AND strftime('%Y', date) = ?
         ORDER BY date DESC`
      )
      .all(monthStr, String(year));
  }

  /**
   * Get expenses total and breakdown by category for a month/year
   */
  public static getMonthlyExpenseSummary(
    month: number,
    year: number
  ): { total: number; byCategory: Array<{ category: string; total: number; count: number }> } {
    const monthStr = String(month).padStart(2, "0");
    const datePattern = `${year}-${monthStr}%`;

    const totalRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM report_expenses
         WHERE date LIKE ?`
      )
      .get(datePattern);

    const byCategory = db
      .prepare(
        `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
         FROM report_expenses
         WHERE date LIKE ?
         GROUP BY category
         ORDER BY total DESC`
      )
      .all(datePattern) as Array<{
        category: string;
        total: number;
        count: number;
      }>;

    return {
      total: totalRow?.total || 0,
      byCategory,
    };
  }

  /**
   * Get expenses for a date range
   */
  public static getExpensesForRange(
    from: string,
    to: string
  ): { total: number; byCategory: Array<{ category: string; total: number; count: number }> } {
    const totalRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM report_expenses
         WHERE DATE(date) BETWEEN ? AND ?`
      )
      .get(from, to);

    const byCategory = db
      .prepare(
        `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
         FROM report_expenses
         WHERE DATE(date) BETWEEN ? AND ?
         GROUP BY category
         ORDER BY total DESC`
      )
      .all(from, to) as Array<{
        category: string;
        total: number;
        count: number;
      }>;

    return {
      total: totalRow?.total || 0,
      byCategory,
    };
  }

  /**
   * Add a new expense to report_expenses
   */
  public static addExpense(expense: {
    amount: number;
    category: string;
    description?: string;
    date: string;
  }): any {
    const created_at = new Date().toISOString();
    return db
      .prepare(
        `INSERT INTO report_expenses (amount, category, description, date, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        expense.amount,
        expense.category,
        expense.description || "",
        expense.date,
        created_at
      );
  }

  /**
   * Delete an expense
   */
  public static deleteExpense(id: number): any {
    return db.prepare(`DELETE FROM report_expenses WHERE id = ?`).run(id);
  }

  /**
   * Get all expenses for a month (raw list)
   */
  public static getExpensesList(month: number, year: number): any[] {
    const monthStr = String(month).padStart(2, "0");
    const datePattern = `${year}-${monthStr}%`;
    return db
      .prepare(
        `SELECT * FROM report_expenses 
         WHERE date LIKE ?
         ORDER BY date DESC`
      )
      .all(datePattern) as any[];
  }

  // ---- Historical chart data ----

  /**
   * Get monthly income totals for the last N months (for chart)
   */
  public static getMonthlyIncomeHistory(months: number = 12): Array<{
    month: string;
    monthNum: number;
    year: number;
    total: number;
  }> {
    const rows = db
      .prepare(
        `SELECT 
          strftime('%m', created_at) as monthNum,
          strftime('%Y', created_at) as year,
          COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE status = 'paid'
          AND created_at >= date('now', '-' || ? || ' months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY year ASC, monthNum ASC`
      )
      .all(months) as Array<{ monthNum: string; year: string; total: number }>;

    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    return rows.map((r) => ({
      month: monthNames[parseInt(r.monthNum) - 1] || r.monthNum,
      monthNum: parseInt(r.monthNum),
      year: parseInt(r.year),
      total: r.total,
    }));
  }

  /**
   * Get monthly expense totals for the last N months (for chart)
   */
  public static getMonthlyExpenseHistory(months: number = 12): Array<{
    month: string;
    monthNum: number;
    year: number;
    total: number;
  }> {
    const rows = db
      .prepare(
        `SELECT 
          strftime('%m', date) as monthNum,
          strftime('%Y', date) as year,
          COALESCE(SUM(amount), 0) as total
        FROM report_expenses
        WHERE date >= date('now', '-' || ? || ' months')
        GROUP BY strftime('%Y-%m', date)
        ORDER BY year ASC, monthNum ASC`
      )
      .all(months) as Array<{ monthNum: string; year: string; total: number }>;

    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    return rows.map((r) => ({
      month: monthNames[parseInt(r.monthNum) - 1] || r.monthNum,
      monthNum: parseInt(r.monthNum),
      year: parseInt(r.year),
      total: r.total,
    }));
  }

  // ---- Product ranking ----

  /**
   * Products ranking for a given month/year
   * Returns ALL products ordered by quantity_sold
   */
  public static getProductRanking(
    month: number,
    year: number,
    order: "top" | "bottom" = "top"
  ): Array<{
    menu_item_id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }> {
    const monthStr = String(month).padStart(2, "0");
    const yearStr = String(year);
    const datePattern = `${yearStr}-${monthStr}%`;
    const orderDir = order === "top" ? "DESC" : "ASC";

    return db.prepare(
      `SELECT 
          oi.menu_item_id,
          COALESCE(mi.name, 'Producto eliminado') as name,
          COALESCE(SUM(oi.quantity), 0) as quantity_sold,
          COALESCE(SUM(oi.subtotal), 0) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE LOWER(o.status) = 'paid'
          AND o.created_at LIKE ?
        GROUP BY oi.menu_item_id, mi.name
        ORDER BY quantity_sold ${orderDir}`
    ).all(datePattern) as Array<{
      menu_item_id: number;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
  }

  /**
   * Products ranking for a date range
   */
  public static getProductRankingForRange(
    from: string,
    to: string,
    order: "top" | "bottom" = "top",
    limit: number = 10
  ): Array<{
    menu_item_id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }> {
    const orderDir = order === "top" ? "DESC" : "ASC";

    return db
      .prepare(
        `SELECT 
          oi.menu_item_id,
          COALESCE(mi.name, 'Producto eliminado') as name,
          COALESCE(SUM(oi.quantity), 0) as quantity_sold,
          COALESCE(SUM(oi.subtotal), 0) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE o.status = 'paid'
          AND DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY oi.menu_item_id
        ORDER BY quantity_sold ${orderDir}
        LIMIT ?`
      )
      .all(from, to, limit) as Array<{
        menu_item_id: number;
        name: string;
        quantity_sold: number;
        revenue: number;
      }>;
  }
}

export default ReportModel;
