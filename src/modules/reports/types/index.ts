// ================================================
// REPORTES MODULE - Types
// ================================================

export interface MonthlyReport {
    period: { month: number; year: number; label: string };
    income: {
        total: number;
        orderCount: number;
        avgTicket: number;
    };
    expenses: {
        total: number;
        byCategory: CategoryBreakdown[];
    };
    netProfit: number;
    variation: {
        incomePercent: number | null;
        expensesPercent: number | null;
        profitPercent: number | null;
    };
}

export interface CategoryBreakdown {
    category: string;
    total: number;
    count: number;
}

export interface ReportExpense {
    id: number;
    amount: number;
    category: string;
    description: string;
    date: string;
    created_at: string;
}

export type ExpenseCategory =
    | "servicios"
    | "proveedores"
    | "supermercado"
    | "otros";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
    { value: "servicios", label: "Servicios", emoji: "⚡" },
    { value: "proveedores", label: "Proveedores", emoji: "📦" },
    { value: "supermercado", label: "Supermercado", emoji: "🛒" },
    { value: "otros", label: "Otros", emoji: "📝" },
];

export interface MonthlyChartData {
    month: string;
    monthNum: number;
    year: number;
    income: number;
    expenses: number;
    profit: number;
}

export interface ProductRankingItem {
    menu_item_id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
}

export interface AddExpensePayload {
    amount: number;
    category: ExpenseCategory;
    description?: string;
    date: string;
}
