import { useEffect, useState, useCallback } from "react";

interface DashboardData {
  today: {
    count: number;
    total: number;
    avg: number;
    topProduct: { name: string; qty: number } | null;
    paymentBreakdown: Array<{ method: string; count: number; total: number }>;
  };
  yesterday: {
    count: number;
    total: number;
    avg: number;
  };
  stockAlerts: Array<{
    id: number;
    name: string;
    current_stock: number;
    alert_threshold: number;
  }>;
  topProducts: Array<{
    menu_item_id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  chartData: Array<{
    month: string;
    monthNum: number;
    year: number;
    income: number;
    expenses: number;
    profit: number;
  }>;
}

function getLocalDateString(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const tzoffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzoffset).toISOString().slice(0, 10);
}

const API = "http://localhost:3001/api";

export default function useDashboard(): [DashboardData | null, boolean, () => void] {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = getLocalDateString(0);
      const yesterdayStr = getLocalDateString(-1);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [todayRes, yesterdayRes, alertsRes, topRes, chartRes] =
        await Promise.all([
          fetch(`${API}/report/report-daily?date=${todayStr}&shift=both`),
          fetch(`${API}/report/report-daily?date=${yesterdayStr}&shift=both`),
          fetch(`${API}/stock/alerts`),
          fetch(`${API}/report/product-ranking?month=${month}&year=${year}&order=top`),
          fetch(`${API}/report/chart-data?months=6`),
        ]);

      const [todayData, yesterdayData, alerts, topProducts, chartData] =
        await Promise.all([
          todayRes.json(),
          yesterdayRes.json(),
          alertsRes.ok ? alertsRes.json() : [],
          topRes.ok ? topRes.json() : [],
          chartRes.ok ? chartRes.json() : [],
        ]);

      setData({
        today: {
          count: Number(todayData.count || 0),
          total: Number(todayData.total || 0),
          avg: Number(todayData.avg || 0),
          topProduct: todayData.topProduct || null,
          paymentBreakdown: todayData.paymentBreakdown || [],
        },
        yesterday: {
          count: Number(yesterdayData.count || 0),
          total: Number(yesterdayData.total || 0),
          avg: Number(yesterdayData.avg || 0),
        },
        stockAlerts: Array.isArray(alerts) ? alerts : [],
        topProducts: Array.isArray(topProducts) ? topProducts.slice(0, 5) : [],
        chartData: Array.isArray(chartData) ? chartData : [],
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return [data, loading, fetchAll];
}
