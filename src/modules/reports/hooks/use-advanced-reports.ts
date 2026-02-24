import { useEffect, useState, useCallback } from "react";
import type {
    MonthlyReport,
    MonthlyChartData,
    ProductRankingItem,
    ReportExpense,
    AddExpensePayload,
} from "../types";

const API = "http://localhost:3001/api/report";

// ==============================
// Monthly report hook
// ==============================
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

// ==============================
// Chart data hook
// ==============================
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

// ==============================
// Product ranking hook
// ==============================
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

// ==============================
// Expenses hook
// ==============================
export function useReportExpenses(month: number, year: number) {
    const [expenses, setExpenses] = useState<ReportExpense[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/expenses?month=${month}&year=${year}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setExpenses(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const addExpense = async (payload: AddExpensePayload) => {
        const res = await fetch(`${API}/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error adding expense");
        await fetchExpenses();
    };

    const deleteExpense = async (id: number) => {
        const res = await fetch(`${API}/expenses/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error deleting expense");
        await fetchExpenses();
    };

    return { expenses, loading, addExpense, deleteExpense, refetch: fetchExpenses };
}
