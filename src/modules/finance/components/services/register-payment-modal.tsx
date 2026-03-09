import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceWithStatus } from "../../types";

interface RegisterPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: ServiceWithStatus | null;
    month: number;
    year: number;
    onSubmit: (data: {
        service_id: number;
        month: number;
        year: number;
        amount_paid: number;
        payment_date: string;
        notes?: string;
    }) => Promise<void>;
}

export default function RegisterPaymentModal({
    open,
    onOpenChange,
    service,
    month,
    year,
    onSubmit,
}: RegisterPaymentModalProps) {
    const today = new Date().toISOString().split("T")[0];
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(today);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // Reset form when opening with a new service
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && service) {
            setAmount(String(service.monthly_amount || ""));
            setDate(today);
            setNotes("");
        }
        onOpenChange(isOpen);
    };

    const handleSubmit = async () => {
        if (!service || !amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            await onSubmit({
                service_id: service.id,
                month,
                year,
                amount_paid: parseFloat(amount),
                payment_date: date,
                notes: notes.trim() || undefined,
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-100">
                        Registrar Pago
                    </DialogTitle>
                    {service && (
                        <p className="text-sm text-slate-500">
                            {service.name} — Esperado:{" "}
                            <span className="text-slate-300">
                                $
                                {service.monthly_amount.toLocaleString("es-AR", {
                                    maximumFractionDigits: 0,
                                })}
                            </span>
                        </p>
                    )}
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">
                            Monto Pagado (ARS) *
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                $
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">Fecha de Pago *</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm text-slate-300">
                            Notas <span className="text-slate-500">(opcional)</span>
                        </Label>
                        <Input
                            type="text"
                            placeholder="Ej: Pagado por transferencia"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !amount || parseFloat(amount) <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? "Registrando..." : "Registrar Pago"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
