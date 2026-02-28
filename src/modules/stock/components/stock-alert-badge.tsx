import { useEffect, useState, useCallback } from "react";

const POLL_INTERVAL = 30_000; // 30 seconds

function StockAlertBadge() {
  const [count, setCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/stock/alerts");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.length);
    } catch {
      // silent — sidebar shouldn't break if backend is down
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  if (count === 0) return null;

  return (
    <span className="relative flex items-center">
      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-ping opacity-75" />
      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
        {count}
      </span>
    </span>
  );
}

export default StockAlertBadge;
