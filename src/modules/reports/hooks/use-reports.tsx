import { useEffect, useState } from "react";

interface ReportsData {
  date?: string;
  count: number;
  total: number;
  avg: number;
  topProduct?: { name: string; qty: number } | null;
}

// interface IFilterProps {
//   timeFilter: string;
//   shift?: "morning" | "afternoon" | "both";
//   dateFrom?: string;
//   dateTo?: string;
// }

const useReports = (
  timeFilter: string,
  shift?: "morning" | "afternoon" | "both"
): [ReportsData | null, boolean, string | null] => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dateParams = new Date();
  switch (timeFilter) {
    case "today":
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      dateParams.toISOString().split("T")[0];
      break;
    case "yesterday":
      dateParams.setDate(dateParams.getDate() - 1);
      // No additional params needed
      break;
  }
  // const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  useEffect(() => {
    const fetchDaily = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:3001/api/report/report-daily?date=${
            dateParams.toISOString().split("T")[0]
          }&shift=${shift || "both"}`
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
        const parsed: ReportsData = {
          date: json.date,
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
  }, [timeFilter, shift, dateParams]);

  return [data, loading, error];
};

export default useReports;
