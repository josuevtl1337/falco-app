import db from "../db.ts";

class ReportModel {
  /**
   * Devuelve conteo, suma y promedio de orders para una fecha (YYYY-MM-DD)
   */
  public static async getDailyReport(
    date: string
  ): Promise<{ count: number; total: number; avg: number }> {
    const data = db
      .prepare(
        `SELECT 
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total,
            COALESCE(AVG(total_amount), 0) as avg
        FROM orders
        WHERE DATE(created_at) = ?`
      )
      .get(date);
    return {
      count: data.count || 0,
      total: data.total || 0,
      avg: data.avg || 0,
    };
  }

  /**
   * Suma total_amount de todas las órdenes de una fecha dada (YYYY-MM-DD).
   * Devuelve 0 si no hay órdenes.
   */
  public static getTotalForDate(date: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = ?`
      )
      .get(date);
    return row?.total ?? 0;
  }

  /**
   * Suma total_amount para un rango de fechas inclusive (YYYY-MM-DD)
   */
  public static getTotalForRange(from: string, to: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) BETWEEN ? AND ?`
      )
      .get(from, to);
    return row?.total ?? 0;
  }

  /**
   * Suma total por turno (morning / afternoon) para una fecha dada
   */
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
}

export default ReportModel;
