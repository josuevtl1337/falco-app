import { useEffect, useState } from "react";

interface ReportsData {
  date?: string;
  count: number;
  total: number;
  avg: number;
  topProduct?: { name: string; qty: number } | null;
}

const useReports = (): [ReportsData | null, boolean, string | null] => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  useEffect(() => {
    const fetchDaily = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:3001/api/report/report-daily?date=${date}`
        );
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok) {
          // Try to extract text for debugging
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        if (!contentType.includes("application/json")) {
          const txt = await res.text();
          throw new Error(`Invalid JSON response: ${txt.slice(0, 200)}`);
        }

        const json = await res.json();
        // Expected shape: { date, count, total, avg }
        const parsed: ReportsData = {
          date: json.date || date,
          count: Number(json.count || 0),
          total: Number(json.total || 0),
          avg: Number(json.avg || 0),
          topProduct: json.topProduct || null,
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
  }, [date]);

  return [data, loading, error];
};

export default useReports;
