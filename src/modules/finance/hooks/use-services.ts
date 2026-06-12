import { useEffect, useState, useCallback } from "react";
import type {
    Service,
    ServiceWithStatus,
    ServiceMonthlySummary,
    ServicePayment,
    AnnualSummaryMonth,
    PaymentStatus,
    Installment,
    InstallmentWithStatus,
    InstallmentMonthlySummary,
} from "../types";

const API = "http://localhost:3001/api";

// ─── Services CRUD ───

export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/services`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setServices(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const createService = async (data: {
        name: string;
        monthly_amount: number;
        due_day: number;
        category: string;
        icon: string;
    }) => {
        const res = await fetch(`${API}/services`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al crear servicio");
        }
        await fetchServices();
        return res.json();
    };

    const updateService = async (
        id: number,
        data: Partial<{
            name: string;
            monthly_amount: number;
            due_day: number;
            category: string;
            icon: string;
        }>
    ) => {
        const res = await fetch(`${API}/services/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al actualizar servicio");
        }
        await fetchServices();
    };

    const deleteService = async (id: number) => {
        const res = await fetch(`${API}/services/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Error al eliminar servicio");
        }
        await fetchServices();
    };

    const toggleActive = async (id: number, active: boolean) => {
        const res = await fetch(`${API}/services/${id}/active`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
        });
        if (!res.ok) throw new Error("Error al cambiar estado");
        await fetchServices();
    };

    return {
        services,
        loading,
        refetch: fetchServices,
        createService,
        updateService,
        deleteService,
        toggleActive,
    };
}

// ─── Service payments for a month ───

function computeStatus(
    payment_id: number | null,
    dueDay: number,
    month: number,
    year: number
): PaymentStatus {
    if (payment_id) return "paid";
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Future month — always pending
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
        return "pending";
    }
    // Past month — overdue
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return "overdue";
    }
    // Current month — check due day
    if (now.getDate() > dueDay) return "overdue";
    return "pending";
}

export function useServicePayments(month: number, year: number) {
    const [services, setServices] = useState<ServiceWithStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API}/services-payments?month=${month}&year=${year}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const enriched: ServiceWithStatus[] = data.map((s: any) => ({
                ...s,
                status: computeStatus(s.payment_id, s.due_day, month, year),
            }));
            setServices(enriched);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const addPayment = async (data: {
        service_id: number;
        month: number;
        year: number;
        amount_paid: number;
        payment_date: string;
        notes?: string;
    }) => {
        const res = await fetch(`${API}/services-payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al registrar pago");
        await fetchPayments();
    };

    const deletePayment = async (paymentId: number) => {
        const res = await fetch(`${API}/services-payments/${paymentId}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar pago");
        await fetchPayments();
    };

    return { services, loading, refetch: fetchPayments, addPayment, deletePayment };
}

// ─── Monthly summary ───

export function useServiceSummary(month: number, year: number) {
    const [summary, setSummary] = useState<ServiceMonthlySummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API}/services-summary?month=${month}&year=${year}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setSummary(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { summary, loading, refetch: fetchSummary };
}

// ─── Annual summary ───

export function useAnnualServiceSummary(year: number) {
    const [data, setData] = useState<AnnualSummaryMonth[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/services-annual-summary?year=${year}`)
            .then((res) => res.json())
            .then((json) => setData(json))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [year]);

    return { data, loading };
}

// ─── Payment history for a specific service ───

export function usePaymentHistory(serviceId: number | null) {
    const [payments, setPayments] = useState<ServicePayment[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!serviceId) {
            setPayments([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/services/${serviceId}/payments`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setPayments(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [serviceId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { payments, loading, refetch: fetchHistory };
}

// ─── Installment expenses ───

export function useInstallments() {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInstallments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/installments`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setInstallments(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInstallments();
    }, [fetchInstallments]);

    const createInstallment = async (data: {
        name: string;
        monthly_amount: number;
        due_day: number;
        total_months: number;
        start_month: number;
        start_year: number;
    }) => {
        const res = await fetch(`${API}/installments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al crear cuota");
        }
        await fetchInstallments();
        return res.json();
    };

    const updateInstallment = async (
        id: number,
        data: Partial<{
            name: string;
            monthly_amount: number;
            due_day: number;
            total_months: number;
            start_month: number;
            start_year: number;
        }>
    ) => {
        const res = await fetch(`${API}/installments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al actualizar cuota");
        }
        await fetchInstallments();
    };

    const deleteInstallment = async (id: number) => {
        const res = await fetch(`${API}/installments/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar cuota");
        await fetchInstallments();
    };

    return {
        installments,
        loading,
        refetch: fetchInstallments,
        createInstallment,
        updateInstallment,
        deleteInstallment,
    };
}

export function useInstallmentPayments(month: number, year: number) {
    const [installments, setInstallments] = useState<InstallmentWithStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/installments-payments?month=${month}&year=${year}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const enriched: InstallmentWithStatus[] = data.map((item: any) => ({
                ...item,
                status: computeStatus(item.payment_id, item.due_day, month, year),
            }));
            setInstallments(enriched);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const addPayment = async (data: {
        installment_id: number;
        month: number;
        year: number;
        amount_paid: number;
        payment_date: string;
        notes?: string;
    }) => {
        const res = await fetch(`${API}/installments-payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al registrar pago de cuota");
        await fetchPayments();
    };

    const deletePayment = async (paymentId: number) => {
        const res = await fetch(`${API}/installments-payments/${paymentId}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar pago de cuota");
        await fetchPayments();
    };

    return { installments, loading, refetch: fetchPayments, addPayment, deletePayment };
}

export function useInstallmentSummary(month: number, year: number) {
    const [summary, setSummary] = useState<InstallmentMonthlySummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/installments-summary?month=${month}&year=${year}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setSummary(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { summary, loading, refetch: fetchSummary };
}
