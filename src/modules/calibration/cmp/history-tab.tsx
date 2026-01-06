// CalibrationHistory.tsx
import * as React from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BrushCleaning, CalendarIcon, Star, StarOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

type Method = "espresso" | "filter";

type Coffee = {
  id: number;
  name: string;
  benefit: string;
  origin?: string | null;
};

type HistoryRow = {
  id: number;
  coffee_id: string;
  coffee_name: string;
  origin: string;
  created_at: string; // ISO
  method: Method;
  dose_g: number; // dose_g
  yield_g: number; // yield_g
  extraction_time_s: number; // extraction_time_s
  ratio_label: string; // "1:2,00"
  final_opinion?: string | null;
  fav: 0 | 1;
  sat: number;
  bal: number;
  tex: number;
  fin: number;
};

type DateRange = { from?: Date; to?: Date };

const PER_PAGE = 20;

export default function CalibrationHistoryTab() {
  // ------------ filtros ------------
  const [coffees, setCoffees] = React.useState<Coffee[]>([]);
  const [coffeeId, setCoffeeId] = React.useState<number | undefined>(undefined);
  const [method, setMethod] = React.useState<Method | "all">("all");
  const [favOnly, setFavOnly] = React.useState(false);
  const [range, setRange] = React.useState<DateRange>({});

  // ------------ datos ------------
  const [rows, setRows] = React.useState<HistoryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // cargar cafés para el select
  React.useEffect(() => {
    fetch("http://localhost:3001/api/calibration/get-coffees")
      .then((r) => r.json())
      .then((data: Coffee[]) => setCoffees(data ?? []))
      .catch(() => setCoffees([]));
  }, []);

  // cargar historial cuando cambien filtros/página
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (coffeeId) params.set("coffee_id", String(coffeeId));
    if (method !== "all") params.set("method", method);
    if (favOnly) params.set("fav", "1");
    if (range.from) params.set("date_from", format(range.from, "yyyy-MM-dd"));
    if (range.to) params.set("date_to", format(range.to, "yyyy-MM-dd"));
    params.set("page", String(page));
    params.set("per_page", String(PER_PAGE));

    setLoading(true);
    fetch(
      `http://localhost:3001/api/calibration/get-calibrations?${params.toString()}`
    )
      .then((r) => r.json())
      .then((data: { items: HistoryRow[]; total: number }) => {
        setRows(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [coffeeId, method, favOnly, range, page]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function resetFilters() {
    setCoffeeId(undefined);
    setMethod("all");
    setFavOnly(false);
    setRange({});
    setPage(1);
  }

  return (
    <Card>
      <CardContent>
        {/* ---------- Toolbar de filtros ---------- */}
        <div className="grid grid-cols-8 gap-8">
          {/* Café */}
          <div className="w-full col-span-2">
            <label className="text-sm mb-1 block">Café</label>
            <Select
              value={coffeeId ? String(coffeeId) : ""}
              onValueChange={(v) => {
                setCoffeeId(v ? Number(v) : undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los cafés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {coffees && coffees.length > 0 && coffees.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} — {c.benefit}
                    {c.origin ? ` — ${c.origin}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método */}
          <div className="w-full col-span-2">
            <label className="text-sm mb-1 block">Método</label>
            <Select
              value={method}
              onValueChange={(v) => {
                setMethod(v as any);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="espresso">Espresso</SelectItem>
                <SelectItem value="filter">Filtrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rango de fechas */}
          <div className="w-full col-span-2">
            <label className="text-sm mb-1 block">Fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !range.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range.from ? (
                    range.to ? (
                      `${format(range.from, "dd/MM/yy", {
                        locale: es,
                      })} — ${format(range.to, "dd/MM/yy", { locale: es })}`
                    ) : (
                      `${format(range.from, "dd/MM/yy", { locale: es })}`
                    )
                  ) : (
                    <span>Elegí rango</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range as any}
                  onSelect={(r: any) => {
                    setRange(r ?? {});
                    setPage(1);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Favoritos */}
          <div className="flex items-center gap-2 col-span-1 mt-6">
            <Switch
              checked={favOnly}
              onCheckedChange={(v) => {
                setFavOnly(!!v);
                setPage(1);
              }}
            />
            <span className="text-sm">Solo favoritos</span>
          </div>

          {/* Limpiar */}
          <div className="ml-auto flex gap-2 col-span-1 mt-6">
            <Button variant="ghost" onClick={resetFilters}>
              <BrushCleaning />
              Limpiar
            </Button>
          </div>
        </div>

        {/* ---------- Tabla ---------- */}
        <div className="mt-4 rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Café</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Seco (g)</TableHead>
                <TableHead className="text-right">Líquido (g)</TableHead>
                <TableHead className="text-right">Ratio</TableHead>
                <TableHead className="text-right">Tiempo (s)</TableHead>
                <TableHead className="text-center">Fav</TableHead>
                <TableHead className="text-center">Eval</TableHead>
                <TableHead>Opinión</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin resultados para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(r.created_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {r.coffee_name}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {r.origin ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.method === "espresso" ? "default" : "secondary"
                        }
                      >
                        {r.method === "espresso" ? "Espresso" : "Filtrado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{r.dose_g}</TableCell>
                    <TableCell className="text-right">{r.yield_g}</TableCell>
                    <TableCell className="text-right">
                      {r.ratio_label}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.extraction_time_s}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.fav ? (
                        <Star className="inline h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="inline h-4 w-4 opacity-50" />
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {r.sat}/{r.bal}/{r.tex}/{r.fin}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {r.final_opinion ?? ""}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ---------- Paginación ---------- */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total > 0
              ? `Mostrando ${(page - 1) * PER_PAGE + 1}–${Math.min(
                page * PER_PAGE,
                total
              )} de ${total}`
              : "0 resultados"}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
