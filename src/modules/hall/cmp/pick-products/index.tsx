import { Button } from "@/components/ui/button";

interface selectedProduct {
  id: string;
  name: string;
  price: number;
  qty: number;
  // options?: string[];
}
interface Props {
  selectedProducts: selectedProduct[];
  onUpdateProductQty: (productId: string, qty: number) => void;
  onPay: () => void;
  onCommand: () => void;
  isReadyToPay: boolean;
  onRemoveProduct?: (productId: string) => void;
  onClearProducts?: () => void;
  onChangeSeat?: () => void;
  onSave?: () => void;
}

function SelectedProducts(props: Props) {
  const {
    selectedProducts,
    onUpdateProductQty,
    onRemoveProduct,
    onClearProducts,
    onCommand,
    isReadyToPay,
    onPay,
    onSave,
  } = props;

  const subtotal = selectedProducts.reduce(
    (acc, p) => acc + p.price * p.qty,
    0
  );

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-lg">
          Orden para <span className="font-bold">Mesa 3</span>
        </span>
        <Button
          variant={"link"}
          onClick={onClearProducts}
          className="text-sm text-[var(--info)] hover:underline"
        >
          Limpiar
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-4">
        {selectedProducts.map((prod, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-1 border-b border-[var(--card-border)] pb-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{prod.name}</span>
              <span className="font-semibold">
                ${prod.price.toLocaleString()}
              </span>
            </div>
            {/* cantidad */}
            <div className="flex items-center gap-2 mt-1">
              <Button
                className="w-7 h-7 rounded bg-gray-700 text-white flex items-center justify-center text-lg font-bold hover:bg-gray-600 transition"
                onClick={() => onUpdateProductQty(prod.id, prod.qty - 1)}
                disabled={prod.qty <= 1}
                aria-label="Disminuir cantidad"
              >
                −
              </Button>
              <span className="min-w-[32px] text-center text-base font-semibold bg-gray-800 text-white rounded px-2 py-1 select-none">
                {prod.qty}
              </span>
              <Button
                onClick={() => onUpdateProductQty(prod.id, prod.qty + 1)}
                className="w-7 h-7 rounded bg-gray-700 text-white flex items-center justify-center text-lg font-bold hover:bg-gray-600 transition"
                aria-label="Aumentar cantidad"
              >
                +
              </Button>
              {onRemoveProduct && (
                <Button
                  variant={"link"}
                  onClick={() => onRemoveProduct(prod.id)}
                  className="ml-auto text-xs text-red-400 hover:underline"
                >
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex justify-end text-sm text-gray-400">
              <span>
                ${prod.price.toLocaleString()} x {prod.qty} ={" "}
                <span className="text-white font-semibold">
                  ${(prod.price * prod.qty).toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t border-[var(--card-border)] pt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Descuento</span>
          <span>$0</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>

        {/* {isReadyToPay && (
          <PaymentSection subtotal={subtotal} isReadyToPay={isReadyToPay} />
        )} */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={"secondary"}
            disabled={selectedProducts.length === 0}
            onClick={onSave}
            className="flex-1 py-2 rounded bg-gray-700 text-white font-semibold hover:brightness-150 hover:bg-gray-700"
          >
            Guardar
          </Button>
          {isReadyToPay ? (
            <Button
              onClick={onPay}
              className="cursor-pointer flex-1 py-2 rounded bg-[var(--pay)] text-white font-semibold"
            >
              Cobrar
            </Button>
          ) : (
            <Button
              onClick={onCommand}
              disabled={selectedProducts.length === 0}
              className="cursor-pointer flex-1 py-2 rounded bg-[var(--primary)] text-white font-semibold"
            >
              Comandar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SelectedProducts;
