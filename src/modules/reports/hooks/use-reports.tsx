import { useEffect, useState } from "react";

interface PaymentBreakdownItem {
  method: "cash" | "transfer" | "other";
  count: number;
  total: number;
}

interface ReportsData {
  date?: string;
  count: number;
  total: number;
  avg: number;
  topProduct?: { name: string; qty: number } | null;
  paymentBreakdown?: PaymentBreakdownItem[];
}

function getLocalDateString(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const tzoffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzoffset).toISOString().slice(0, 10);
}

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const tzoffset = now.getTimezoneOffset() * 60000;
  const from = new Date(monday.getTime() - tzoffset).toISOString().slice(0, 10);
  const to = getLocalDateString(0);
  return { from, to };
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const tzoffset = now.getTimezoneOffset() * 60000;
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = new Date(firstDay.getTime() - tzoffset).toISOString().slice(0, 10);
  const to = getLocalDateString(0);
  return { from, to };
}

export type { ReportsData, PaymentBreakdownItem };

const useReports = (
  timeFilter: string,
  shift?: "morning" | "afternoon" | "both"
): [ReportsData | null, boolean, string | null] => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDaily = async () => {
      setLoading(true);
      setError(null);

      let url: string;
      const shiftParam = shift || "both";

      switch (timeFilter) {
        case "yesterday": {
          const dateStr = getLocalDateString(-1);
          url = `http://localhost:3001/api/report/report-daily?date=${dateStr}&shift=${shiftParam}`;
          break;
        }
        case "week": {
          const { from, to } = getWeekRange();
          url = `http://localhost:3001/api/report/report-daily?from=${from}&to=${to}&shift=${shiftParam}`;
          break;
        }
        case "month": {
          const { from, to } = getMonthRange();
          url = `http://localhost:3001/api/report/report-daily?from=${from}&to=${to}&shift=${shiftParam}`;
          break;
        }
        case "today":
        default: {
          const dateStr = getLocalDateString(0);
          url = `http://localhost:3001/api/report/report-daily?date=${dateStr}&shift=${shiftParam}`;
          break;
        }
      }

      try {
        const res = await fetch(url);
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        if (!contentType.includes("application/json")) {
          const txt = await res.text();
          throw new Error(`Invalid JSON response: ${txt.slice(0, 200)}`);
        }

        const json = await res.json();
        const parsed: ReportsData = {
          date: json.date,
          count: Number(json.count || 0),
          total: Number(json.total || 0),
          avg: Number(json.avg || 0),
          topProduct: json.topProduct || null,
          paymentBreakdown: json.paymentBreakdown || [],
        };
        setData(parsed);
      } catch (err: any) {
        console.error("Error fetching daily report:", err.message || err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDaily();
  }, [timeFilter, shift]);

  return [data, loading, error];
};

export default useReports;
export { getLocalDateString, getWeekRange, getMonthRange };
