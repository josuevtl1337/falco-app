import { useState } from "react";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import type { ServiceMonthlySummary } from "../../types";

interface PendingAlertBannerProps {
    summary: ServiceMonthlySummary | null;
    month: number;
    year: number;
}

function formatCurrency(value: number): string {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    });
}

export default function PendingAlertBanner({
    summary,
    month,
    year,
}: PendingAlertBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (!summary || dismissed) return null;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const dayOfMonth = now.getDate();

    const isCurrentMonth = month === currentMonth && year === currentYear;
    const isPastMonth =
        year < currentYear || (year === currentYear && month < currentMonth);
    const isReminderPeriod = isCurrentMonth && dayOfMonth <= 10;

    const pendingCount = summary.pendingCount;
    const pendingAmount = summary.totalExpected - summary.totalPaid;

    if (pendingCount === 0) return null;

    // During days 1-10: prominent warning
    if (isReminderPeriod) {
        return (
            <div className="relative flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 mb-4">
                <IconAlertTriangle
                    size={20}
                    className="text-yellow-400 shrink-0 animate-pulse"
                />
                <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-200">
                        Tienes {pendingCount}{" "}
                        {pendingCount === 1
                            ? "servicio pendiente"
                            : "servicios pendientes"}{" "}
                        de pago
                    </p>
                    <p className="text-xs text-yellow-400/70 mt-0.5">
                        Total pendiente: {formatCurrency(pendingAmount)}
                    </p>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-yellow-400/50 hover:text-yellow-400 transition-colors"
                >
                    <IconX size={16} />
                </button>
            </div>
        );
    }

    // Past months or after day 10 with unpaid: subtle overdue alert
    if (isPastMonth || (isCurrentMonth && dayOfMonth > 10)) {
        return (
            <div className="relative flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 mb-4">
                <IconAlertTriangle size={16} className="text-red-400/70 shrink-0" />
                <p className="text-xs text-red-400/70">
                    {pendingCount}{" "}
                    {pendingCount === 1
                        ? "servicio vencido"
                        : "servicios vencidos"}{" "}
                    · {formatCurrency(pendingAmount)}
                </p>
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-auto text-red-400/30 hover:text-red-400 transition-colors"
                >
                    <IconX size={14} />
                </button>
            </div>
        );
    }

    return null;
}
