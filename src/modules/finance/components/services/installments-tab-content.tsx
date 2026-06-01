import { useState } from "react";
import { toast } from "sonner";
import {
    useInstallmentPayments,
    useInstallments,
    useInstallmentSummary,
} from "../../hooks/use-services";
import type { InstallmentWithStatus } from "../../types";
import ServiceSummaryCards from "./service-summary-cards";
import InstallmentList from "./installment-list";
import AddInstallmentModal from "./add-installment-modal";
import RegisterInstallmentPaymentModal from "./register-installment-payment-modal";

interface InstallmentsTabContentProps {
    month: number;
    year: number;
    onReportRefresh?: () => void;
}

export default function InstallmentsTabContent({
    month,
    year,
    onReportRefresh,
}: InstallmentsTabContentProps) {
    const {
        installments,
        loading: paymentsLoading,
        addPayment,
        deletePayment,
        refetch: refetchPayments,
    } = useInstallmentPayments(month, year);
    const {
        createInstallment,
        updateInstallment,
        deleteInstallment,
    } = useInstallments();
    const {
        summary,
        loading: summaryLoading,
        refetch: refetchSummary,
    } = useInstallmentSummary(month, year);

    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingInstallment, setEditingInstallment] = useState<InstallmentWithStatus | null>(null);
    const [payingInstallment, setPayingInstallment] = useState<InstallmentWithStatus | null>(null);

    const refreshAll = () => {
        refetchPayments();
        refetchSummary();
        onReportRefresh?.();
    };

    const handleCreateInstallment = async (data: {
        name: string;
        monthly_amount: number;
        due_day: number;
        total_months: number;
        start_month: number;
        start_year: number;
    }) => {
        try {
            await createInstallment(data);
            toast.success("Cuota creada correctamente");
            setShowInstallmentModal(false);
            refreshAll();
        } catch (err: any) {
            toast.error(err.message || "Error al crear cuota");
        }
    };

    const handleUpdateInstallment = async (data: {
        name: string;
        monthly_amount: number;
        due_day: number;
        total_months: number;
        start_month: number;
        start_year: number;
    }) => {
        if (!editingInstallment) return;
        try {
            await updateInstallment(editingInstallment.id, data);
            toast.success("Cuota actualizada");
            setShowInstallmentModal(false);
            setEditingInstallment(null);
            refreshAll();
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar cuota");
        }
    };

    const handleDeleteInstallment = async (installment: InstallmentWithStatus) => {
        if (!window.confirm(`Eliminar el gasto en cuotas "${installment.name}"?`)) return;
        try {
            await deleteInstallment(installment.id);
            toast.success("Cuota eliminada");
            refreshAll();
        } catch {
            toast.error("Error al eliminar cuota");
        }
    };

    const handleRegisterPayment = async (data: {
        installment_id: number;
        month: number;
        year: number;
        amount_paid: number;
        payment_date: string;
        notes?: string;
    }) => {
        try {
            await addPayment(data);
            toast.success("Pago de cuota registrado");
            refreshAll();
        } catch {
            toast.error("Error al registrar pago de cuota");
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!window.confirm("Anular este pago de cuota?")) return;
        try {
            await deletePayment(paymentId);
            toast.success("Pago de cuota anulado");
            refreshAll();
        } catch {
            toast.error("Error al anular pago de cuota");
        }
    };

    return (
        <div className="space-y-6">
            <ServiceSummaryCards
                summary={summary}
                loading={summaryLoading}
                totalTitle="Total en Cuotas"
                itemLabel="cuotas activas"
            />

            <InstallmentList
                installments={installments}
                loading={paymentsLoading}
                onRegisterPayment={(installment) => {
                    setPayingInstallment(installment);
                    setShowPaymentModal(true);
                }}
                onEdit={(installment) => {
                    setEditingInstallment(installment);
                    setShowInstallmentModal(true);
                }}
                onDelete={handleDeleteInstallment}
                onDeletePayment={handleDeletePayment}
                onAddNew={() => {
                    setEditingInstallment(null);
                    setShowInstallmentModal(true);
                }}
            />

            <AddInstallmentModal
                open={showInstallmentModal}
                onOpenChange={(open) => {
                    setShowInstallmentModal(open);
                    if (!open) setEditingInstallment(null);
                }}
                onSubmit={editingInstallment ? handleUpdateInstallment : handleCreateInstallment}
                editingInstallment={editingInstallment}
                defaultMonth={month}
                defaultYear={year}
            />

            <RegisterInstallmentPaymentModal
                open={showPaymentModal}
                onOpenChange={setShowPaymentModal}
                installment={payingInstallment}
                month={month}
                year={year}
                onSubmit={handleRegisterPayment}
            />
        </div>
    );
}
