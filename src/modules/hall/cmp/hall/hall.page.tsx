import { useContext, useMemo } from "react";
import { OrderStateData } from "../..";
import Banquets from "./banquets";
import TableWithChairs from "./tables";
import { Button } from "@/components/ui/button";
import { Power, Sun, SunMoon } from "lucide-react";
import { ShiftContext, ShiftType } from "@/App";
import TakeAway from "./take-away";

interface IHallPageProps {
  onChangeSeat: (id: string) => void;
  onChangeShift: (shift: ShiftType) => void;
  orders: OrderStateData[];
  activeSeat: string;
  handleCloseShift: () => void;
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
  activeSeat,
  handleCloseShift,
}) => {
  // const [shiftLocal, setShiftLocal] = useState<"morning" | "afternoon">(
  //   "morning"
  // );

  const { shift } = useContext(ShiftContext);
  console.log(shift);

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
    [activeBanquetIds]
  );

  const mappedTables = useMemo(
    () =>
      tables.map((b) => ({
        ...b,
        hasOrder: activeBanquetIds.has(b.id),
      })),
    [activeBanquetIds]
  );

  const isAnyOrderOpen = useMemo(() => orders.length > 0, [orders]);

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div className="flex flex-row justify-between">
        <div className="flex items-center gap-4 justify-between w-full">
          <div className="text-sm text-white font-light">
            {`Turno: `}{" "}
            <span className="text-lg font-medium text-[var(--info)]">
              {shift === "morning" ? "Mañana" : "Tarde"}
            </span>
          </div>

          <div className="inline-flex rounded-lg border border-[var(--card-border)] bg-[#0f1315] p-1">
            <Button
              type="button"
              variant={"secondary"}
              onClick={() => {
                onChangeShift("morning");
              }}
              className={
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " +
                (shift === "morning"
                  ? "bg-[var(--foreground)] text-black"
                  : "text-gray-300 hover:bg-[rgba(255,255,255,0.02)]")
              }
              aria-pressed={shift === "morning"}
              title="Mañana"
            >
              <Sun />
            </Button>

            <Button
              type="button"
              onClick={() => {
                onChangeShift("afternoon");
              }}
              variant={"secondary"}
              className={
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " +
                (shift === "afternoon"
                  ? "bg-[var(--foreground)] text-black"
                  : "text-gray-300 hover:bg-[rgba(255,255,255,0.02)]")
              }
              aria-pressed={shift === "afternoon"}
              title="Tarde"
            >
              <SunMoon />
            </Button>
          </div>
          {!isAnyOrderOpen && (
            <Button
              variant={"outline"}
              type="button"
              onClick={handleCloseShift}
              className="px-3 py-1 rounded-lg text-sm font-semibold"
            >
              <Power />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 flex-col justify-between">
        <div className="flex flex-row gap-4">
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
                  activeSeat={activeSeat}
                />
              ))}
            </div>
          </div>
          {/* Take Away */}
          <div>
            <p className="text-sm font-semibold text-white my-4">Take Away</p>
            <div className="flex flex-col gap-4">
              <TakeAway
                isClickable
                label="Take Away"
                id="TA1"
                onClick={onChangeSeat}
                activeSeat={activeSeat}
                hasOrder={activeBanquetIds.has("TA1")}
              />
              <TakeAway
                isClickable
                label="Take Away"
                id="TA2"
                onClick={onChangeSeat}
                activeSeat={activeSeat}
                hasOrder={activeBanquetIds.has("TA2")}
              />
              <TakeAway
                isClickable
                label="Take Away"
                id="TA3"
                onClick={onChangeSeat}
                activeSeat={activeSeat}
                hasOrder={activeBanquetIds.has("TA3")}
              />
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
                    activeSeat={activeSeat}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-start ml-12 mt-12">
        <TableWithChairs
          seats={4}
          label="Mesa 4"
          id="M4"
          onClick={onChangeSeat}
          activeSeat={activeSeat}
          hasOrder={activeBanquetIds.has("M4")}
        />
      </div>
    </div>
  );
};

export default HallPage;
