import { OrderStateData } from "@/modules/hall";
import { ArrowLeft, CreditCard, Plus } from "lucide-react";
import { useMemo } from "react";

interface Props {
  onCreate: () => void;
  onBack?: () => void;
  orders?: OrderStateData[];
  tableSelected?: string;
  viewCommand?: () => void;
}

function CreateOrderState(props: Props) {
  const { onBack, onCreate, orders, viewCommand, tableSelected } = props;

  const activeBanquetIds = useMemo(
    () => orders && new Set(orders.map((o) => o.table_number)),
    [orders]
  );

  const hasOrder = tableSelected && activeBanquetIds?.has(tableSelected);

  return (
    <main>
      <div>
        <button
          onClick={onBack}
          className="text-sm text-[color:var(--primary)] hover:underline mb-4 cursor-pointer"
        >
          <ArrowLeft />
        </button>

        <div className="h-[70vh] w-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-row justify-start items-start gap-6">
          {hasOrder ? (
            <div
              onClick={() => viewCommand && viewCommand()}
              className="border-2 radius-xl rounded-2xl border-gray-300 p-4 max-w-[250px] flex flex-row gap-2 justify-center items-center hover:border-gray-50 cursor-pointer"
            >
              <Plus />
              <h1 className="text-md">Editar comanda</h1>
            </div>
          ) : (
            <div
              onClick={onCreate}
              className="border-2 radius-xl rounded-2xl border-gray-300 p-4 max-w-[250px] flex flex-row gap-2 justify-center items-center hover:border-gray-50 cursor-pointer"
            >
              <Plus />
              <h1 className="text-md">Comandar</h1>
            </div>
          )}

          {/* <div
            onClick={onCreate}
            className="border-2 radius-xl rounded-2xl border-gray-300 p-4 max-w-[250px] flex flex-row gap-2 justify-center items-center hover:border-gray-50 cursor-pointer"
          >
            <Pen />
            <h1 className="text-md">Modificar Comanda</h1>
          </div> */}

          {hasOrder && (
            <div
              onClick={onCreate}
              className="border-2 radius-xl rounded-2xl border-gray-300 p-4 max-w-[250px] flex flex-row gap-2 justify-center items-center hover:border-gray-50 cursor-pointer"
            >
              <CreditCard />
              <h1 className="text-md">Cobrar</h1>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default CreateOrderState;
