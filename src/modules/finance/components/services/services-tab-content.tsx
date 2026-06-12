import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    useInstallmentPayments,
    useServicePayments,
    useServices,
} from "../../hooks/use-services";
import type { ServiceMonthlySummary, ServiceWithStatus } from "../../types";
import ServiceSummaryCards from "./service-summary-cards";
import ServiceList from "./service-list";
import ServiceChart from "./service-chart";
import AnnualSummaryTable from "./annual-summary-table";
import PendingAlertBanner from "./pending-alert-banner";
import AddServiceModal from "./add-service-modal";
import RegisterPaymentModal from "./register-payment-modal";
import InstallmentsTabContent from "./installments-tab-content";
import { toast } from "sonner";

type ConfirmAction =
    | { type: "delete-service"; service: ServiceWithStatus }
    | null;

interface ServicesTabContentProps {
    month: number;
    year: number;
    summary: ServiceMonthlySummary | null;
    summaryLoading: boolean;
    onSummaryRefresh: () => void;
    onReportRefresh?: () => void;
}

export default function ServicesTabContent({
    month,
    year,
    summary,
    summaryLoading,
    onSummaryRefresh,
    onReportRefresh,
}: ServicesTabContentProps) {
    const {
        services: servicePayments,
        loading: paymentsLoading,
        addPayment,
        refetch: refetchPayments,
    } = useServicePayments(month, year);
    const {
        installments: installmentPayments,
        refetch: refetchInstallmentPayments,
    } = useInstallmentPayments(month, year);

    const {
        createService,
        updateService,
        deleteService,
    } = useServices();

    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingService, setEditingService] = useState<ServiceWithStatus | null>(null);
    const [payingService, setPayingService] = useState<ServiceWithStatus | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const refreshAll = () => {
        refetchPayments();
        refetchInstallmentPayments();
        onSummaryRefresh();
        onReportRefresh?.();
    };

    const handleCreateService = async (data: {
        name: string;
        monthly_amount: number;
        due_day: number;
        category: string;
        icon: string;
    }) => {
        try {
            await createService(data);
            toast.success("Servicio creado correctamente");
            setShowServiceModal(false);
            refreshAll();
        } catch (err: any) {
            toast.error(err.message || "Error al crear servicio");
        }
    };

    const handleUpdateService = async (data: {
        name: string;
        monthly_amount: number;
        due_day: number;
        category: string;
        icon: string;
    }) => {
        if (!editingService) return;
        try {
            await updateService(editingService.id, data);
            toast.success("Servicio actualizado");
            setShowServiceModal(false);
            setEditingService(null);
            refreshAll();
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar servicio");
        }
    };

    const handleDeleteService = (service: ServiceWithStatus) => {
        setConfirmAction({ type: "delete-service", service });
    };

    const handleRegisterPayment = async (data: {
        service_id: number;
        month: number;
        year: number;
        amount_paid: number;
        payment_date: string;
        notes?: string;
    }) => {
        try {
            await addPayment(data);
            toast.success("Pago registrado correctamente");
            refreshAll();
        } catch {
            toast.error("Error al registrar pago");
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;

        setConfirmLoading(true);
        try {
            await deleteService(confirmAction.service.id);
            toast.success("Servicio anulado");
            setConfirmAction(null);
            refreshAll();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error al anular servicio");
        } finally {
            setConfirmLoading(false);
        }
    };

    const confirmCopy = {
        title: "Anular servicio",
        description: confirmAction
            ? `El servicio "${confirmAction.service.name}" se va a ocultar de Servicios Fijos. Los pagos históricos quedan guardados para no romper reportes anteriores.`
            : "",
        confirmLabel: "Anular servicio",
    };

    return (
        <div>
            <Tabs defaultValue="fixed" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-900/70">
                    <TabsTrigger value="fixed">Servicios Fijos</TabsTrigger>
                    <TabsTrigger value="installments">Cuotas</TabsTrigger>
                </TabsList>

                <TabsContent value="fixed" className="mt-6 space-y-6">
                    {/* Alert banner */}
                    <PendingAlertBanner summary={summary} month={month} year={year} />

                    {/* Summary cards */}
                    <ServiceSummaryCards summary={summary} loading={summaryLoading} />

                    {/* Service list + Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3">
                            <ServiceList
                                services={servicePayments}
                                loading={paymentsLoading}
                                onRegisterPayment={(s) => {
                                    setPayingService(s);
                                    setShowPaymentModal(true);
                                }}
                                onEdit={(s) => {
                                    setEditingService(s);
                                    setShowServiceModal(true);
                                }}
                                onDelete={handleDeleteService}
                                onAddNew={() => {
                                    setEditingService(null);
                                    setShowServiceModal(true);
                                }}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <ServiceChart
                                services={servicePayments}
                                installments={installmentPayments}
                            />
                        </div>
                    </div>

                    {/* Annual summary */}
                    <AnnualSummaryTable year={year} />
                </TabsContent>

                <TabsContent value="installments" className="mt-6">
                    <InstallmentsTabContent
                        month={month}
                        year={year}
                        onReportRefresh={onReportRefresh}
                    />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <AddServiceModal
                open={showServiceModal}
                onOpenChange={(open) => {
                    setShowServiceModal(open);
                    if (!open) setEditingService(null);
                }}
                onSubmit={editingService ? handleUpdateService : handleCreateService}
                editingService={editingService}
            />

            <RegisterPaymentModal
                open={showPaymentModal}
                onOpenChange={setShowPaymentModal}
                service={payingService}
                month={month}
                year={year}
                onSubmit={handleRegisterPayment}
            />

            <Dialog
                open={confirmAction !== null}
                onOpenChange={(open) => {
                    if (!open && !confirmLoading) setConfirmAction(null);
                }}
            >
                <DialogContent className="border-slate-800 bg-slate-950 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>{confirmCopy.title}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {confirmCopy.description}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmAction(null)}
                            disabled={confirmLoading}
                            className="border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmAction}
                            disabled={confirmLoading}
                            className="bg-red-600 text-white hover:bg-red-500"
                        >
                            {confirmLoading ? "Procesando..." : confirmCopy.confirmLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
