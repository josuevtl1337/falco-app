import useReports from "../hooks/use-reports";
import { Button } from "@/components/ui/button";

export default function DailyMetrics() {
  const [data, loading, error] = useReports();
  // const { from, to, quick } = filters;
  // const { setQuick } = setFilters;

  console.log(data);

  return (
    <div className="rounded-lg border border-[var(--card-border)] p-4 bg-[var(--card-background)] space-y-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Reportes diarios
          </p>
          <p className="text-xs text-slate-400">{/* Rango: {from} → {to} */}</p>
        </div>
        <div>
          {/* <Button
            // onClick={reload}
            className="text-xs px-2 py-1 rounded text-white"
          >
            Actualizar
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg  bg-[var(--card-background)] border-1 border-[var(--card-border)]">
          <p className="text-xs ">Total vendido</p>
          <div className="text-lg font-bold ">
            {data?.total?.toLocaleString?.() ?? 0}
          </div>
        </div>
        <div className="p-3 rounded-lg   border-1 border-[var(--card-border)]">
          <p className="text-xs text-slate-400">Órdenes</p>
          <div className="text-lg font-bold ">
            {data?.count?.toLocaleString?.() ?? 0}
          </div>
        </div>

        <div className="p-3 rounded-lg   border-1 border-[var(--card-border)]">
          <p className="text-xs ">Promedio / ticket</p>
          <div className="text-lg font-bold">
            {/* ${Math.round(kpis.avg || 0).toLocaleString()} */}
            {data?.avg?.toLocaleString?.() ?? 0}
          </div>
        </div>

        <div className="p-3 rounded-lg  border-1 border-[var(--card-border)]">
          <p className="text-xs ">Producto top</p>
          <div className="text-sm font-semibold ">
            {data?.topProduct
              ? `${data.topProduct.name} (${data.topProduct.qty})`
              : "N/A"}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        {/* <Button
          className={`px-2 py-1 rounded text-sm ${
            quick === "today" ? " text-white" : " text-slate-200"
          }`}
          onClick={() => setQuick("today")}
        >
          Hoy
        </Button> */}
        {/* <Button
          className={`px-2 py-1 rounded text-sm ${
            quick === "yesterday"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-200"
          }`}
          onClick={() => setQuick("yesterday")}
        >
          Ayer
        </Button> */}
        {/* <Button
          className={`px-2 py-1 rounded text-sm ${
            quick === "last7"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-200"
          }`}
          onClick={() => setQuick("last7")}
        >
          Últimos 7
        </Button>
        <Button
          className={`px-2 py-1 rounded text-sm ${
            quick === "month"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-200"
          }`}
          onClick={() => setQuick("month")}
        >
          Este mes
        </Button> */}
      </div>
    </div>
  );
}
