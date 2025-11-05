import { useMemo, useState } from "react";
import { OrderStateData } from "../..";
import Banquets from "./banquets";
import TableWithChairs from "./tables";
import { Button } from "@/components/ui/button";
import { Sun, SunMoon } from "lucide-react";

interface IHallPageProps {
  onChangeSeat: (id: string) => void;
  onChangeShift: (shift: string) => void;
  orders: OrderStateData[];
}

// Hall disposal
// Banquets
const banquets = [
  { id: "B1", label: "B1" },
  { id: "B2", label: "B2" },
  { id: "B3", label: "B3" },
  { id: "B4", label: "B4" },
  { id: "B5", label: "B5" },
  { id: "B6", label: "B6" },
];

const tables = [
  { id: "M1", label: "Mesa 1", seats: 0 },
  { id: "M2", label: "Mesa 2", seats: 0 },
  { id: "M3", label: "Mesa 3", seats: 0 },
  { id: "M4", label: "Mesa 4", seats: 0 },
];
const HallPage: React.FC<IHallPageProps> = ({
  onChangeSeat,
  onChangeShift,
  orders,
}) => {
  const [shiftLocal, setShiftLocal] = useState<"morning" | "afternoon">(
    "morning"
  );

  const activeBanquetIds = useMemo(
    () => new Set(orders.map((o) => o.table_number)),
    [orders]
  );

  const mappedBanquets = useMemo(
    () =>
      banquets.map((b) => ({
        ...b,
        hasOrder: activeBanquetIds.has(b.id),
      })),
    [banquets, activeBanquetIds]
  );

  const mappedTables = useMemo(
    () =>
      tables.map((b) => ({
        ...b,
        hasOrder: activeBanquetIds.has(b.id),
      })),
    [tables, activeBanquetIds]
  );

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div className="flex flex-row justify-between">
        <div className="flex items-center gap-4 justify-between w-full">
          <div className="text-lg text-white font-light">
            {`Turno: `}{" "}
            <span className="text-sm font-medium text-[var(--info)]">
              {shiftLocal === "morning" ? "Mañana" : "Tarde"}
            </span>
          </div>

          <div className="inline-flex rounded-lg border border-[var(--card-border)] bg-[#0f1315] p-1">
            <Button
              type="button"
              variant={"secondary"}
              onClick={() => {
                setShiftLocal("morning");
                onChangeShift("morning");
              }}
              className={
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " +
                (shiftLocal === "morning"
                  ? "bg-[var(--foreground)] text-black"
                  : "text-gray-300 hover:bg-[rgba(255,255,255,0.02)]")
              }
              aria-pressed={shiftLocal === "morning"}
              title="Mañana"
            >
              <Sun />
            </Button>

            <Button
              type="button"
              onClick={() => {
                setShiftLocal("afternoon");
                onChangeShift("afternoon");
              }}
              variant={"secondary"}
              className={
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " +
                (shiftLocal === "afternoon"
                  ? "bg-[var(--foreground)] text-black"
                  : "text-gray-300 hover:bg-[rgba(255,255,255,0.02)]")
              }
              aria-pressed={shiftLocal === "afternoon"}
              title="Tarde"
            >
              <SunMoon />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-row gap-24">
          {/* Banquetas */}
          <div className="flex flex-col items-start bg-[#043d4c] rounded-xl p-2 min-w-[80px]">
            <div className="text-sm font-semibold text-white">Banquetas</div>
            <div className="flex flex-col w-full">
              {mappedBanquets.map((banquet) => (
                <Banquets
                  key={banquet.id}
                  label={banquet.label}
                  isClickable
                  onClick={onChangeSeat}
                  hasOrder={banquet.hasOrder}
                />
              ))}
            </div>
          </div>

          {/* Mesas */}
          <div className="flex flex-col flex-1 items-center justify-between pt-12">
            {mappedTables.map((table) => {
              if (table.id === "M4") return null;
              return (
                <div
                  key={table.id}
                  className="flex justify-center w-full mb-12"
                >
                  <TableWithChairs
                    seats={table.seats}
                    label={table.label}
                    onClick={onChangeSeat}
                    hasOrder={table.hasOrder}
                    id={table.id}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-start ml-12 mt-24">
        <TableWithChairs seats={4} label="M4" onClick={onChangeSeat} />
      </div>
    </div>
  );
};

export default HallPage;
