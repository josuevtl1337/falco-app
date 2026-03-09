import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAnnualServiceSummary } from "../../hooks/use-services";

interface AnnualSummaryTableProps {
    year: number;
}

const MONTH_LABELS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatCurrency(value: number): string {
    if (value === 0) return "—";
    return "$" + value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export default function AnnualSummaryTable({ year }: AnnualSummaryTableProps) {
    const { data, loading } = useAnnualServiceSummary(year);

    const totalExpected = data.reduce((acc, m) => acc + m.totalExpected, 0);
    const totalPaid = data.reduce((acc, m) => acc + m.totalPaid, 0);

    return (
        <Card className="border-slate-800 bg-slate-950/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-200">
                        Resumen Anual {year}
                    </CardTitle>
                    <div className="text-sm text-slate-400">
                        Total:{" "}
                        <span className="font-medium text-slate-200">
                            ${totalPaid.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </span>
                        {" / "}
                        <span className="text-slate-500">
                            ${totalExpected.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-24 flex items-center justify-center">
                        <p className="text-slate-500 animate-pulse">Cargando...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-800 hover:bg-slate-900/50">
                                    <TableHead className="text-slate-400 text-xs font-medium">
                                        Concepto
                                    </TableHead>
                                    {MONTH_LABELS.map((label) => (
                                        <TableHead
                                            key={label}
                                            className="text-center text-slate-400 text-xs font-medium min-w-[60px]"
                                        >
                                            {label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="border-slate-800 hover:bg-slate-900/30">
                                    <TableCell className="text-slate-300 text-xs font-medium">
                                        Esperado
                                    </TableCell>
                                    {data.map((m) => (
                                        <TableCell
                                            key={m.month}
                                            className="text-center text-slate-500 text-xs"
                                        >
                                            {formatCurrency(m.totalExpected)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow className="border-slate-800 hover:bg-slate-900/30">
                                    <TableCell className="text-slate-300 text-xs font-medium">
                                        Pagado
                                    </TableCell>
                                    {data.map((m) => (
                                        <TableCell
                                            key={m.month}
                                            className={`text-center text-xs font-medium ${
                                                m.totalPaid > 0
                                                    ? "text-emerald-400"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {formatCurrency(m.totalPaid)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow className="border-slate-800 hover:bg-slate-900/30">
                                    <TableCell className="text-slate-300 text-xs font-medium">
                                        Pagados
                                    </TableCell>
                                    {data.map((m) => (
                                        <TableCell
                                            key={m.month}
                                            className={`text-center text-xs ${
                                                m.paidCount === m.activeCount && m.activeCount > 0
                                                    ? "text-emerald-400"
                                                    : m.paidCount > 0
                                                        ? "text-yellow-400"
                                                        : "text-slate-600"
                                            }`}
                                        >
                                            {m.activeCount > 0
                                                ? `${m.paidCount}/${m.activeCount}`
                                                : "—"}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
