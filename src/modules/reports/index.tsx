import { useState, useCallback } from "react";
import MonthSelector from "./components/month-selector";
import MetricCards from "./components/metric-cards";
import RevenueChart from "./components/revenue-chart";
import ProductRanking from "./components/product-ranking";
import ExpensesSection from "./components/expenses-section";
import { useMonthlyReport } from "./hooks/use-advanced-reports";
import { IconFileSpreadsheet } from "@tabler/icons-react";

function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, loading, refetch } = useMonthlyReport(month, year);

  const handleExpenseChange = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <main className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconFileSpreadsheet size={28} className="text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-slate-100">Reportes</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-1">
            Análisis mensual, gastos e históricos de tu cafetería
          </p>
        </div>

        <MonthSelector
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </div>

      {/* Period label */}
      {data?.period && (
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-200">
            {data.period.label}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">
            · Comparado con mes anterior
          </span>
        </div>
      )}

      {/* Metric Cards */}
      <MetricCards data={data} loading={loading} />

      {/* Charts + Ranking Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RevenueChart months={12} />
        </div>
        <div className="lg:col-span-2">
          <ProductRanking month={month} year={year} />
        </div>
      </div>

      {/* Expenses Section */}
      <ExpensesSection
        month={month}
        year={year}
        report={data}
        onExpenseChange={handleExpenseChange}
      />
    </main>
  );
}

export default ReportsPage;
