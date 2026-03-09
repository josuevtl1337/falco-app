import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatARS } from "@/modules/commons/utils/helpers";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface OrderCartProps {
  items: CartItem[];
  activeSeat: string;
  onUpdateProductQty: (productId: string, qty: number) => void;
  onRemoveProduct: (productId: string) => void;
  onClearProducts: () => void;
  onCommand: () => void;
  onSave: () => void;
  onPay: () => void;
  onPrint: () => void;
  isReadyToPay: boolean;
  isRegisterOpen: boolean;
}

function OrderCart({
  items,
  activeSeat,
  onUpdateProductQty,
  onRemoveProduct,
  onClearProducts,
  onCommand,
  onSave,
  onPay,
  onPrint,
  isReadyToPay,
  isRegisterOpen,
}: OrderCartProps) {
  const subtotal = items.reduce((acc, p) => acc + p.price * p.qty, 0);

  // Empty state: no seat selected
  if (!activeSeat) {
    return (
      <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col items-center justify-center gap-3">
        <ShoppingCart size={40} className="text-gray-600" />
        <p className="text-sm text-gray-500 text-center">
          Selecciona una mesa para comenzar
        </p>
      </div>
    );
  }

  // Empty state: seat selected but no items
  if (items.length === 0) {
    return (
      <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-base text-white">
            Orden: {activeSeat}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Plus size={32} className="text-gray-600" />
          <p className="text-sm text-gray-500 text-center">
            Agrega productos al pedido
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-base text-white">
          Orden: {activeSeat}
        </span>
        <Button
          variant="link"
          onClick={onClearProducts}
          className="text-xs text-[var(--info)] hover:underline p-0 h-auto"
        >
          Limpiar
        </Button>
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="flex flex-col gap-2">
          {items.map((prod) => (
            <div
              key={prod.id}
              className="flex flex-col gap-1 border-b border-[var(--card-border)] pb-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-white truncate max-w-[160px]">
                  {prod.name}
                </span>
                <span className="font-semibold text-sm text-white">
                  {formatARS(prod.price * prod.qty)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="w-6 h-6 rounded bg-gray-700 text-white flex items-center justify-center text-sm font-bold hover:bg-gray-600 p-0"
                  onClick={() => onUpdateProductQty(prod.id, prod.qty - 1)}
                  disabled={prod.qty <= 1}
                >
                  −
                </Button>
                <span className="min-w-[28px] text-center text-sm font-semibold bg-gray-800 text-white rounded px-1.5 py-0.5 select-none">
                  {prod.qty}
                </span>
                <Button
                  size="sm"
                  onClick={() => onUpdateProductQty(prod.id, prod.qty + 1)}
                  className="w-6 h-6 rounded bg-gray-700 text-white flex items-center justify-center text-sm font-bold hover:bg-gray-600 p-0"
                >
                  +
                </Button>
                <Button
                  variant="link"
                  onClick={() => onRemoveProduct(prod.id)}
                  className="ml-auto text-[10px] text-red-400 hover:underline p-0 h-auto"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Totals & actions */}
      <div className="mt-3 border-t border-[var(--card-border)] pt-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Subtotal</span>
          <span className="text-white">{formatARS(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-white mb-3">
          <span>Total</span>
          <span>{formatARS(subtotal)}</span>
        </div>

        {/* Print button */}
        {isReadyToPay && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="w-full mb-2 text-xs border-[var(--card-border)] text-gray-300"
          >
            Imprimir Ticket
          </Button>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={items.length === 0}
            onClick={onSave}
            className="flex-1 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600"
          >
            Guardar
          </Button>
          {isReadyToPay ? (
            <Button
              onClick={onPay}
              className="flex-1 py-2 rounded-lg bg-[var(--pay)] text-white text-sm font-semibold cursor-pointer"
            >
              Cobrar
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!isRegisterOpen) {
                  toast.error("Debés abrir la caja antes de comandar");
                  return;
                }
                onCommand();
              }}
              disabled={items.length === 0}
              className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold cursor-pointer"
            >
              Comandar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderCart;
