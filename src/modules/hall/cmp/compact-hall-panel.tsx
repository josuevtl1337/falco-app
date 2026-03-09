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
const TAKE_AWAY = ["TA1", "TA2", "TA3"];
const TABLES = ["M1", "M2", "M3", "M4"];

function SeatChip({
  id,
  isActive,
  hasOrder,
  onClick,
}: {
  id: string;
  isActive: boolean;
  hasOrder: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "relative h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center",
        "border-2",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
          : hasOrder
            ? "border-green-500/50 bg-green-500/10 text-green-400"
            : "border-[var(--card-border)] bg-[#0f1315] text-gray-400 hover:border-gray-500 hover:text-gray-300"
      )}
    >
      {hasOrder && !isActive && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500" />
      )}
      {id}
    </button>
  );
}

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
    [orders]
  );

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Shift & Register */}
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
                : "bg-transparent text-gray-400 hover:text-gray-200"
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
                : "bg-transparent text-gray-400 hover:text-gray-200"
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
              : "border-orange-500 text-orange-400 bg-orange-500/10"
          )}
          title={isRegisterOpen ? "Cerrar Caja" : "Abrir Caja"}
        >
          {isRegisterOpen ? <LockOpen size={14} /> : <Lock size={14} />}
          <span className="ml-1">{isRegisterOpen ? "Caja" : "Caja"}</span>
        </Button>
      </div>

      {/* Banquetas */}
      <div>
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Banquetas
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {BANQUETS.map((id) => (
            <SeatChip
              key={id}
              id={id}
              isActive={activeSeat === id}
              hasOrder={orderTableNumbers.has(id)}
              onClick={onChangeSeat}
            />
          ))}
        </div>
      </div>

      {/* Take Away */}
      <div>
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Take Away
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {TAKE_AWAY.map((id) => (
            <SeatChip
              key={id}
              id={id}
              isActive={activeSeat === id}
              hasOrder={orderTableNumbers.has(id)}
              onClick={onChangeSeat}
            />
          ))}
        </div>
      </div>

      {/* Mesas */}
      <div>
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Mesas
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {TABLES.map((id) => (
            <SeatChip
              key={id}
              id={id}
              isActive={activeSeat === id}
              hasOrder={orderTableNumbers.has(id)}
              onClick={onChangeSeat}
            />
          ))}
        </div>
      </div>

      {/* Active seat indicator */}
      {activeSeat && (
        <div className="mt-auto pt-3 border-t border-[var(--card-border)]">
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
