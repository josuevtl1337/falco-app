import MetricCards from "./metric-cards";
import RevenueChart from "./revenue-chart";
import ProductRanking from "./product-ranking";
import type { MonthlyReport } from "../../types";

interface ReportsTabContentProps {
    month: number;
    year: number;
    data: MonthlyReport | null;
    loading: boolean;
}

export default function ReportsTabContent({
    month,
    year,
    data,
    loading,
}: ReportsTabContentProps) {
    return (
        <div className="space-y-6">
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
        </div>
    );
}
