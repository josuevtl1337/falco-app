import { useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LockOpen, Lock, Sun, SunMoon } from "lucide-react";
import { ShiftContext, ShiftType } from "@/App";
import { cn } from "@/lib/utils";
import type { OrderStateData } from "..";

interface CompactHallPanelProps {
  onChangeSeat: (id: string) => void;
  onChangeShift: (shift: ShiftType) => void;
  orders: OrderStateData[];
  activeSeat: string;
  onRegisterClick: () => void;
  isRegisterOpen: boolean;
}

const BANQUETS = ["B1", "B2", "B3", "B4", "B5", "B6"];
const TABLES = ["M1", "M2", "M3", "M4"];
const TAKE_AWAY = ["TA1", "TA2", "TA3"];
const VEREDA = ["MV1"];

/* ── Seat chip ─────────────────────────────────────────── */
function SeatChip({
  id,
  isActive,
  hasOrder,
  onClick,
  variant = "default",
}: {
  id: string;
  isActive: boolean;
  hasOrder: boolean;
  onClick: (id: string) => void;
  variant?: "default" | "stool" | "table" | "takeaway" | "vereda";
}) {
  const shape =
    variant === "stool"
      ? "rounded-full w-9 h-9"
      : variant === "table"
        ? "rounded-lg w-full h-10"
        : variant === "vereda"
          ? "rounded-lg w-full h-9 border-dashed"
          : variant === "takeaway"
            ? "rounded-md w-full h-9"
            : "rounded-lg h-9 w-full";

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "relative text-xs font-bold transition-all flex items-center justify-center border-2",
        shape,
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)] shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          : hasOrder
            ? "border-green-500/50 bg-green-500/10 text-green-400"
            : "border-[var(--card-border)] bg-[#0f1315] text-gray-400 hover:border-gray-500 hover:text-gray-300",
      )}
    >
      {hasOrder && !isActive && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-[var(--card-background)]" />
      )}
      {id}
    </button>
  );
}

/* ── Main panel ────────────────────────────────────────── */
function CompactHallPanel({
  onChangeSeat,
  onChangeShift,
  orders,
  activeSeat,
  onRegisterClick,
  isRegisterOpen,
}: CompactHallPanelProps) {
  const { shift } = useContext(ShiftContext);

  const orderTableNumbers = useMemo(
    () => new Set(orders.map((o) => o.table_number)),
    [orders],
  );

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-4 flex flex-col gap-3 overflow-y-auto">
      {/* ── Shift & Register ─────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-[var(--card-border)] bg-[#0f1315] p-0.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChangeShift("morning")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition",
              shift === "morning"
                ? "bg-[var(--foreground)] text-black"
                : "bg-transparent text-gray-400 hover:text-gray-200",
            )}
            title="Mañana"
          >
            <Sun size={14} />
            <span className="hidden xl:inline">AM</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChangeShift("afternoon")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition",
              shift === "afternoon"
                ? "bg-[var(--foreground)] text-black"
                : "bg-transparent text-gray-400 hover:text-gray-200",
            )}
            title="Tarde"
          >
            <SunMoon size={14} />
            <span className="hidden xl:inline">PM</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onRegisterClick}
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-xs font-semibold",
            isRegisterOpen
              ? "border-green-500 text-green-400 bg-green-500/10"
              : "border-orange-500 text-orange-400 bg-orange-500/10",
          )}
          title={isRegisterOpen ? "Cerrar Caja" : "Abrir Caja"}
        >
          {isRegisterOpen ? <LockOpen size={14} /> : <Lock size={14} />}
          <span className="ml-1">Caja</span>
        </Button>
      </div>

      {/* ── Salon Layout (matches real floor plan) ──── */}
      <div className="flex flex-col gap-2">
        {/* Label */}
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          Salón
        </h3>

        {/* Floor plan: banquetas left, mesas right */}
        <div className="border border-[var(--card-border)] rounded-xl bg-[#0a0e10] p-3">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0">
            {/* LEFT COLUMN — Barra / Banquetas (vertical column of circles) */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] uppercase tracking-wider text-gray-600 font-semibold">
                Barra
              </span>
              {/* B1-B4 */}
              {BANQUETS.map((id) => (
                <SeatChip
                  key={id}
                  id={id}
                  variant="stool"
                  isActive={activeSeat === id}
                  hasOrder={orderTableNumbers.has(id)}
                  onClick={onChangeSeat}
                />
              ))}
            </div>

            {/* RIGHT COLUMN — Mesas (stacked vertically) */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] uppercase tracking-wider text-gray-600 font-semibold">
                Mesas
              </span>
              {/* M1-M3 together */}
              {TABLES.filter((id) => id !== "M4").map((id) => (
                <SeatChip
                  key={id}
                  id={id}
                  variant="table"
                  isActive={activeSeat === id}
                  hasOrder={orderTableNumbers.has(id)}
                  onClick={onChangeSeat}
                />
              ))}
              {/* M4 separated — mesa grande para 4 */}
              <div className="mt-16">
                <SeatChip
                  id="M4"
                  variant="table"
                  isActive={activeSeat === "M4"}
                  hasOrder={orderTableNumbers.has("M4")}
                  onClick={onChangeSeat}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Take Away ──────────────────────── */}
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
            Take Away
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {TAKE_AWAY.map((id) => (
              <SeatChip
                key={id}
                id={id}
                variant="takeaway"
                isActive={activeSeat === id}
                hasOrder={orderTableNumbers.has(id)}
                onClick={onChangeSeat}
              />
            ))}
          </div>
        </div>

        {/* ── Vereda (outside table) ─────────── */}
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
            Vereda
          </h3>
          <div className="grid grid-cols-1 gap-1.5">
            {VEREDA.map((id) => (
              <SeatChip
                key={id}
                id={id}
                variant="vereda"
                isActive={activeSeat === id}
                hasOrder={orderTableNumbers.has(id)}
                onClick={onChangeSeat}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Active seat indicator ────────────── */}
      {activeSeat && (
        <div className="pt-3 border-t border-[var(--card-border)]">
          <div className="text-xs text-gray-500">Seleccionado</div>
          <div className="text-lg font-bold text-[var(--primary)]">
            {activeSeat}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactHallPanel;
