import DailyMetrics from "./components/daily-metrics";
import { Button } from "@/components/ui/button";

export default function ReportsTab() {
  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-slate-100">
            Resumen de ventas
          </p>
        </div>

        <div className="hidden md:flex gap-2">
          <Button onClick={() => window.location.reload()}>Actualizar</Button>
        </div>
      </header>

      <div className="gap-4">
        <DailyMetrics />
      </div>
    </div>
  );
}
