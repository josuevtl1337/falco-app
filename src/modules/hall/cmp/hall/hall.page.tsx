import Banquets from "./banquets";
import TableWithChairs from "./tables";

function HallPage() {
  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div className="font-bold text-lg mb-4 text-white">Salón</div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-row gap-24">
          {/* Banquetas */}
          <div className="flex flex-col items-start bg-[#043d4c] rounded-xl p-4 min-w-[120px]">
            <div className="text-sm font-semibold mb-4 text-white">
              Banquetas
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Banquets label="7" />
              <Banquets label="8" />
              <Banquets label="9" />
              <Banquets label="10" />
              <Banquets label="11" />
              <Banquets label="12" />
            </div>
          </div>
          {/* Mesas */}
          <div className="flex flex-col flex-1 items-center justify-between py-24">
            <TableWithChairs seats={2} label="Mesa 1" />
            <TableWithChairs seats={2} label="Mesa 2" />
          </div>
        </div>

        <div className="flex justify-start ml-18">
          <TableWithChairs seats={4} label="Mesa 3" />
        </div>
        {/* Selector y botón */}
        <div className="flex items-center justify-between mt-8">
          <select className="bg-[#181c1f] border border-[var(--card-border)] rounded-lg px-4 py-2 text-white">
            <option>Mesa 1</option>
            <option>Mesa 2</option>
            <option>Mesa 3</option>
          </select>
          <button className="bg-[var(--primary)] text-white font-semibold px-6 py-2 rounded-lg ml-4">
            Nueva orden
          </button>
        </div>
      </div>
    </div>
  );
}

export default HallPage;
