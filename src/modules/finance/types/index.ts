// ================================================
// FINANCE MODULE - Types
// ================================================

// --- Reports types (migrated from reports module) ---

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

// --- Expense types (migrated from reports module) ---

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

export interface AddExpensePayload {
    amount: number;
    category: ExpenseCategory;
    description?: string;
    date: string;
}

// --- Service types (new) ---

export interface Service {
    id: number;
    name: string;
    monthly_amount: number;
    due_day: number;
    category: string;
    icon: string;
    active: number;
    created_at?: string;
    updated_at?: string;
}

export interface ServicePayment {
    id: number;
    service_id: number;
    month: number;
    year: number;
    amount_paid: number;
    payment_date: string;
    notes: string;
    created_at?: string;
}

export type PaymentStatus = "paid" | "pending" | "overdue";

export interface ServiceWithStatus extends Service {
    payment_id: number | null;
    amount_paid: number | null;
    payment_date: string | null;
    payment_notes: string | null;
    status: PaymentStatus;
}

export interface ServiceMonthlySummary {
    activeCount: number;
    totalExpected: number;
    totalPaid: number;
    paidCount: number;
    pendingCount: number;
}

export interface AnnualSummaryMonth {
    month: number;
    totalExpected: number;
    totalPaid: number;
    paidCount: number;
    activeCount: number;
}

export const SERVICE_CATEGORIES: { value: string; label: string; icon: string }[] = [
    { value: "connectivity", label: "Conectividad", icon: "wifi" },
    { value: "rent", label: "Alquiler", icon: "home" },
    { value: "software", label: "Software", icon: "code" },
    { value: "tax", label: "Impuestos", icon: "receipt" },
    { value: "professional", label: "Profesional", icon: "user" },
    { value: "utility", label: "Servicios Públicos", icon: "bolt" },
    { value: "other", label: "Otros", icon: "dots" },
];
