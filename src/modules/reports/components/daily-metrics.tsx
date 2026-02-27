import { useState } from "react";
import useReports from "../hooks/use-reports";
// import { Calendar } from "@/components/ui/calendar";
// import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DailyOrdersTable from "./daily-orders-table";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { es } from "date-fns/locale";

export default function DailyMetrics() {
  const [shift, setShift] = useState<"morning" | "afternoon" | "both">("both");
  const [timeFilter, setTimeFilter] = useState<string>("today");

  const [data] = useReports(timeFilter, shift);

  function getTodayString() {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    return localISOTime;
}

  // const [dateRange, setDateRange] = useState<DateRange | undefined>({
  //   from: new Date(2025, 5, 12),
  //   to: new Date(2025, 6, 15),
  // });

  // const [showCalendar, setShowCalendar] = useState(false);

  // console.log(data);

  // Función para obtener etiqueta del rango de fechas
  // const getDateRangeLabel = () => {
  //   if (!dateRange?.from) return "Seleccionar fechas";
  //   if (!dateRange?.to)
  //     return format(dateRange.from, "dd MMM yyyy", { locale: es });
  //   return `${format(dateRange.from, "dd MMM", { locale: es })} - ${format(
  //     dateRange.to,
  //     "dd MMM yyyy",
  //     { locale: es }
  //   )}`;
  // };

  return (
    <div className="w-full space-y-6">
      {/* Header con título */}
      <div>
        <p className="text-sm text-slate-400 mt-1">
          Visualiza tus métricas de desempeño
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-slate-800 bg-slate-950/50 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Turnos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Turno</label>
            <ToggleGroup
              type="single"
              value={shift}
              onValueChange={(value) => value && setShift(value as any)}
              className="justify-start"
            >
              <ToggleGroupItem
                value="morning"
                className="rounded-lg border border-slate-700 hover:bg-slate-800 data-[state=on]:bg-blue-600 data-[state=on]:border-blue-500"
              >
                <span className="text-sm">🌅 Mañana</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="afternoon"
                className="rounded-lg border border-slate-700 hover:bg-slate-800 data-[state=on]:bg-blue-600 data-[state=on]:border-blue-500"
              >
                <span className="text-sm">🌆 Tarde</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="both"
                className="rounded-lg border border-slate-700 hover:bg-slate-800 data-[state=on]:bg-blue-600 data-[state=on]:border-blue-500"
              >
                <span className="text-sm">📊 Ambos</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Período de tiempo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Período
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button
                variant={timeFilter === "today" ? "default" : "outline"}
                className={`rounded-lg text-xs md:text-sm font-medium transition-all ${timeFilter === "today"
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                  }`}
                onClick={() => setTimeFilter("today")}
              >
                Hoy
              </Button>

              <Button
                variant={timeFilter === "yesterday" ? "default" : "outline"}
                className={`rounded-lg text-xs md:text-sm font-medium transition-all ${timeFilter === "yesterday"
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                  }`}
                onClick={() => setTimeFilter("yesterday")}
              >
                Ayer
              </Button>

              <Button
                variant={timeFilter === "week" ? "default" : "outline"}
                className={`rounded-lg text-xs md:text-sm font-medium transition-all ${timeFilter === "week"
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                  }`}
                onClick={() => setTimeFilter("week")}
                disabled
              >
                Esta semana
              </Button>

              <Button
                variant={timeFilter === "month" ? "default" : "outline"}
                className={`rounded-lg text-xs md:text-sm font-medium transition-all ${timeFilter === "month"
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                  }`}
                onClick={() => setTimeFilter("month")}
                disabled
              >
                Este mes
              </Button>

              {/* Popover con calendario */}
              {/* <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant={timeFilter === "custom" ? "default" : "outline"}
                    className={`rounded-lg text-xs md:text-sm font-medium transition-all ${
                      timeFilter === "custom"
                        ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                        : "border-slate-700 hover:bg-slate-800 text-slate-300"
                    }`}
                    disabled
                  >
                    <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Personalizado
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-950 border-slate-800"
                  align="end"
                >
                  <div className="p-4">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range);
                        if (range?.from && range?.to) {
                          setTimeFilter("custom");
                        }
                      }}
                      numberOfMonths={2}
                      className="rounded-lg"
                      disabled={(date) =>
                        date > new Date() || date < new Date("2023-01-01")
                      }
                    />
                  </div>
                </PopoverContent>
              </Popover> */}
            </div>

            {/* Mostrar rango de fechas seleccionadas */}
            {/* {timeFilter === "custom" && (
              <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-900 rounded">
                📅 {getDateRangeLabel()}
              </div>
            )} */}
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total vendido */}
        <Card className="border-slate-800 bg-gradient-to-br from-blue-950/50 to-slate-950/50 hover:border-blue-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              ${data?.total?.toLocaleString?.() ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">% vs período anterior</p>
          </CardContent>
        </Card>

        {/* Órdenes */}
        <Card className="border-slate-800 bg-gradient-to-br from-purple-950/50 to-slate-950/50 hover:border-purple-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {data?.count?.toLocaleString?.() ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transacciones completadas
            </p>
          </CardContent>
        </Card>

        {/* Promedio por ticket */}
        <Card className="border-slate-800 bg-gradient-to-br from-green-950/50 to-slate-950/50 hover:border-green-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Promedio / Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              ${data?.avg?.toLocaleString?.() ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Por cada transacción</p>
          </CardContent>
        </Card>

        {/* Producto Top */}
        <Card className="border-slate-800 bg-gradient-to-br from-orange-950/50 to-slate-950/50 hover:border-orange-700/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Producto Top
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400 truncate">
              {data?.topProduct?.name ?? "N/A"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {data?.topProduct?.qty
                ? `${data.topProduct.qty} unidades vendidas`
                : "Sin datos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Área para gráficos adicionales (opcional) */}
      <Card className="border-slate-800 bg-slate-950/50">
        <CardHeader>
          <CardTitle className="text-lg">Detalles</CardTitle>
        </CardHeader>
        <CardContent>
            {/* Solo mostrar tabla si el filtro es "today", "yesterday" o similar que mapee a un dia especifico 
                Para simplificar, mostramos la tabla de HOY por defecto o filtrada si 'timeFilter' es 'today'.
            */}
          <DailyOrdersTable date={timeFilter === "today" ? getTodayString() : undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
