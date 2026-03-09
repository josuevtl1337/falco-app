import { useEffect, useState, useCallback } from "react";
import type { ReportExpense, AddExpensePayload } from "../types";

const API = "http://localhost:3001/api/report";

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
