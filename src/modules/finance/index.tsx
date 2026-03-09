import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IconReportMoney } from "@tabler/icons-react";
import MonthSelector from "./components/month-selector";
import ReportsTabContent from "./components/reports/reports-tab-content";
import ExpensesTabContent from "./components/expenses/expenses-tab-content";
import ServicesTabContent from "./components/services/services-tab-content";
import { useMonthlyReport } from "./hooks/use-reports";
import { useServiceSummary } from "./hooks/use-services";

function FinancePage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const { data: reportData, loading: reportLoading } = useMonthlyReport(month, year);
    const {
        summary: serviceSummary,
        loading: summaryLoading,
        refetch: refetchSummary,
    } = useServiceSummary(month, year);

    return (
        <main className="p-6 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <IconReportMoney size={28} className="text-[var(--primary)]" />
                        <h1 className="text-2xl font-bold text-slate-100">Finanzas</h1>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 ml-1">
                        Reportes, gastos y servicios fijos de tu cafetería
                    </p>
                </div>

                <MonthSelector
                    month={month}
                    year={year}
                    onMonthChange={setMonth}
                    onYearChange={setYear}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="reports" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="reports">Reportes</TabsTrigger>
                    <TabsTrigger value="expenses">Gastos</TabsTrigger>
                    <TabsTrigger value="services" className="flex items-center gap-1.5">
                        Servicios
                        {(serviceSummary?.pendingCount ?? 0) > 0 && (
                            <Badge
                                variant="destructive"
                                className="ml-1 text-[10px] px-1.5 py-0"
                            >
                                {serviceSummary!.pendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="mt-6">
                    <ReportsTabContent
                        month={month}
                        year={year}
                        data={reportData}
                        loading={reportLoading}
                    />
                </TabsContent>

                <TabsContent value="expenses" className="mt-6">
                    <ExpensesTabContent month={month} year={year} />
                </TabsContent>

                <TabsContent value="services" className="mt-6">
                    <ServicesTabContent
                        month={month}
                        year={year}
                        summary={serviceSummary}
                        summaryLoading={summaryLoading}
                        onSummaryRefresh={refetchSummary}
                    />
                </TabsContent>
            </Tabs>
        </main>
    );
}

export default FinancePage;
