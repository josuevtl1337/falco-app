import { useEffect, useState, useCallback } from "react";
import type {
    MonthlyReport,
    MonthlyChartData,
    ProductRankingItem,
} from "../types";

const API = "http://localhost:3001/api/report";

export function useMonthlyReport(month: number, year: number) {
    const [data, setData] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/monthly?month=${month}&year=${year}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    return { data, loading, error, refetch: fetchReport };
}

export function useChartData(months: number = 12) {
    const [data, setData] = useState<MonthlyChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/chart-data?months=${months}`)
            .then((res) => res.json())
            .then((json) => setData(json))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [months]);

    return { data, loading };
}

export function useProductRanking(
    month: number,
    year: number,
    order: "top" | "bottom" = "top"
) {
    const [data, setData] = useState<ProductRankingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            month: String(month),
            year: String(year),
            order,
        });

        fetch(`${API}/product-ranking?${params}`)
            .then((res) => res.json())
            .then((json) => setData(json))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [month, year, order]);

    return { data, loading };
}
