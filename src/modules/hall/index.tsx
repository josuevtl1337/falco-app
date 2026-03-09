import { useCallback, useContext, useEffect, useState } from "react";
import { IMenuItem as IProduct } from "backend/models/MenuModel";
import { toast } from "sonner";
import { ShiftContext } from "@/App";
import { useCashRegister } from "./hooks/useCashRegister";
import { useMenuData } from "./hooks/useMenuData";
import { PaymentData } from "./cmp/checkout/payment-section";
import CompactHallPanel from "./cmp/compact-hall-panel";
import PosMenuGrid from "./cmp/pos-menu-grid";
import OrderCart from "./cmp/order-cart";
import CheckoutSheetContent from "./cmp/checkout-sheet-content";
import RegisterOpeningDialog from "./cmp/cash-register/register-opening-dialog";
import RegisterClosingDialog from "./cmp/cash-register/register-closing-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface OrderStateData {
  id: string;
  table_number: string;
  shift: string;
  status: string;
  discount_percentage: number;
  total_amount: number;
  items: {
    menu_item_id: string;
    menu_item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
}

export interface OrderProduct extends IProduct {
  qty: number;
}

function OrdersPage() {
  const [seat, setSeat] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const { shift, setShift } = useContext(ShiftContext);

  const [orders, setOrders] = useState<OrderStateData[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderStateData | null>(null);

  // Menu data
  const { products, categories } = useMenuData();

  // Cash register state
  const {
    isOpen: isRegisterOpen,
    register,
    openRegister,
    closeRegister,
    fetchBakeryStock,
  } = useCashRegister();
  const [showOpeningDialog, setShowOpeningDialog] = useState(false);
  const [showClosingDialog, setShowClosingDialog] = useState(false);

  const handleRegisterClick = useCallback(() => {
    if (isRegisterOpen) {
      if (orders.length > 0) {
        toast.error(
          "Cerrá todas las comandas abiertas antes de cerrar la caja"
        );
        return;
      }
      setShowClosingDialog(true);
    } else {
      setShowOpeningDialog(true);
    }
  }, [isRegisterOpen, orders]);

  const handleOpenRegister = useCallback(
    async (data: Parameters<typeof openRegister>[0]) => {
      try {
        await openRegister(data);
        setShowOpeningDialog(false);
        toast.success("Caja abierta correctamente");
      } catch (err: any) {
        toast.error(err.message || "Error al abrir caja");
      }
    },
    [openRegister]
  );

  const handleCloseRegister = useCallback(
    async (data: Parameters<typeof closeRegister>[0]) => {
      try {
        await closeRegister(data);
        setShowClosingDialog(false);
        toast.success("Caja cerrada correctamente");
        setOrders([]);
        setSeat("");
        setCurrentOrder(null);
      } catch (err: any) {
        toast.error(err.message || "Error al cerrar caja");
      }
    },
    [closeRegister]
  );

  const computeSubtotal = (items: OrderStateData["items"]) =>
    items.reduce((acc, p) => acc + p.unit_price * p.quantity, 0);

  const makeOrderItem = (product: OrderProduct) => ({
    menu_item_id: product.id,
    menu_item_name: product.name,
    quantity: 1,
    unit_price: product.price,
    subtotal: product.price,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addOrIncrementItem = (
    items: OrderStateData["items"],
    product: OrderProduct
  ) => {
    const idx = items.findIndex((i) => i.menu_item_id === product.id);
    if (idx >= 0) {
      return items.map((it, i) =>
        i === idx
          ? {
              ...it,
              quantity: it.quantity + 1,
              subtotal: it.unit_price * (it.quantity + 1),
            }
          : it
      );
    }
    return [...items, makeOrderItem(product)];
  };

  const addProduct = useCallback(
    (product: OrderProduct) => {
      setCurrentOrder((prev) => {
        if (prev) {
          const items = addOrIncrementItem(prev.items, product);
          return { ...prev, items, total_amount: computeSubtotal(items) };
        }
        const items = [makeOrderItem(product)];
        return {
          id: "",
          table_number: seat,
          shift,
          status: "",
          discount_percentage: 0,
          total_amount: computeSubtotal(items),
          items,
        };
      });
    },
    [addOrIncrementItem, seat, shift]
  );

  const updateProductQty = useCallback((productId: string, qty: number) => {
    setCurrentOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items
        .map((p) =>
          p.menu_item_id === productId
            ? {
                ...p,
                quantity: Math.max(1, qty),
                subtotal: p.unit_price * Math.max(1, qty),
              }
            : p
        )
        .filter((p) => p.quantity > 0);
      return { ...prev, items, total_amount: computeSubtotal(items) };
    });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setCurrentOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i.menu_item_id !== productId);
      return { ...prev, items, total_amount: computeSubtotal(items) };
    });
  }, []);

  const clearProducts = useCallback(() => {
    setCurrentOrder((prev) =>
      prev ? { ...prev, items: [], total_amount: 0 } : prev
    );
  }, []);

  const onChangeSeat = useCallback(
    (tableNumber: string) => {
      setSeat(tableNumber);
      const found = orders.find((o) => o.table_number === tableNumber) ?? null;
      setCurrentOrder(found);
    },
    [orders]
  );

  const onCommand = useCallback(async () => {
    if (!isRegisterOpen) {
      toast.error("Debés abrir la caja antes de comandar");
      return;
    }
    if (!currentOrder) return;
    const body = {
      table_number: seat,
      shift,
      status: "open",
      discount_percentage: currentOrder.discount_percentage || 0,
      total_amount: computeSubtotal(currentOrder.items),
      items: currentOrder.items.map((p) => ({
        menu_item_id: p.menu_item_id,
        quantity: p.quantity,
        unit_price: p.unit_price,
        subtotal: p.subtotal,
      })),
    };

    try {
      const res = await fetch("http://localhost:3001/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      toast.info("Se ha generado la comanda");
      setOrders((prev) => [...prev, data.newOrder]);
      setCurrentOrder(data.newOrder);
    } catch (err) {
      console.error("Error creating order:", err);
    }
  }, [currentOrder, seat, shift, isRegisterOpen]);

  const onPay = useCallback(
    async (paymentData: PaymentData) => {
      if (!currentOrder) return;

      const body = {
        ...currentOrder,
        status: "paid",
        payment_method_id: paymentData.paymentMethod.id,
        discount_percentage: paymentData.discount_percentage,
        total_amount: paymentData.total_amount,
      };

      try {
        const res = await fetch(
          `http://localhost:3001/api/orders/${currentOrder.id}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage =
            errorData?.message || "Error al procesar el pago";

          if (errorMessage.includes("Stock insuficiente")) {
            toast.error(errorMessage, { duration: 6000 });
          } else {
            toast.error(errorMessage);
          }
          return;
        }

        toast.success("¡Cachiiinnn! ☕💰 ");
        setCheckoutOpen(false);
        setPendingClose(true);
        await getAllOrders();
      } catch (err) {
        console.error("Error fetching orders:", err);
        toast.error("Error de conexión al procesar el pago");
      }
    },
    [currentOrder]
  );

  const onEditCommand = useCallback(async () => {
    if (!currentOrder) return;
    const body = {
      ...currentOrder,
      total_amount: computeSubtotal(currentOrder.items),
      items: currentOrder.items.map((p) => ({
        menu_item_id: p.menu_item_id,
        quantity: p.quantity,
        unit_price: p.unit_price,
        subtotal: p.subtotal,
      })),
    };

    try {
      const res = await fetch(
        `http://localhost:3001/api/orders/${currentOrder.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Network response was not ok");
      toast.success("Se ha editado la comanda  :) ");
      await getAllOrders();
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, [currentOrder]);

  const onPrint = useCallback(
    async (paymentData?: PaymentData) => {
      if (!currentOrder) return;

      let body: Record<string, unknown> = {
        ...currentOrder,
        items: currentOrder.items.map((p) => ({
          menu_item_id: p.menu_item_id,
          menu_item_name: p.menu_item_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
          subtotal: p.subtotal,
        })),
      };

      if (paymentData) {
        body = {
          ...currentOrder,
          status: "paid",
          payment_method_id: paymentData.paymentMethod.id,
          discount_percentage: paymentData.discount_percentage,
          total_amount: paymentData.total_amount,
        };
      }

      try {
        const response = await fetch("http://localhost:3001/api/print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch FE");
        }
      } catch (error) {
        console.error("Error printing order:", error);
      }
    },
    [currentOrder]
  );

  const getAllOrders = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/get-orders", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    getAllOrders();
  }, []);

  // Clean up seat/order after checkout Sheet finishes closing
  useEffect(() => {
    if (!checkoutOpen && pendingClose) {
      const timer = setTimeout(() => {
        setPendingClose(false);
        setSeat("");
        setCurrentOrder(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [checkoutOpen, pendingClose]);

  // Map current order items to cart format
  const cartItems = currentOrder
    ? currentOrder.items.map((item) => ({
        id: item.menu_item_id,
        qty: item.quantity,
        name: item.menu_item_name,
        price: item.unit_price,
      }))
    : [];

  return (
    <div>
      <div
        className="h-[95vh] grid gap-3"
        style={{ gridTemplateColumns: "240px 1fr 300px" }}
      >
        {/* Left: Compact Hall Panel */}
        <CompactHallPanel
          onChangeSeat={onChangeSeat}
          onChangeShift={setShift}
          orders={orders}
          activeSeat={seat}
          onRegisterClick={handleRegisterClick}
          isRegisterOpen={isRegisterOpen}
        />

        {/* Center: Always-visible Menu Grid */}
        <PosMenuGrid
          products={products}
          categories={categories}
          onSelectProduct={addProduct}
          disabled={!seat}
        />

        {/* Right: Always-visible Cart */}
        <OrderCart
          items={cartItems}
          activeSeat={seat}
          onUpdateProductQty={updateProductQty}
          onRemoveProduct={removeProduct}
          onClearProducts={clearProducts}
          onCommand={onCommand}
          onSave={onEditCommand}
          onPay={() => setCheckoutOpen(true)}
          onPrint={() => onPrint()}
          isReadyToPay={currentOrder?.status === "open" || false}
          isRegisterOpen={isRegisterOpen}
        />
      </div>

      {/* Checkout Sheet */}
      <Sheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      >
        <SheetContent
          side="right"
          className="w-[480px] sm:max-w-[480px] bg-[var(--card-background)] border-l border-[var(--card-border)] text-white p-0"
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-[var(--card-border)]">
            <SheetTitle className="text-white text-lg">
              Cobro de orden
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              {currentOrder
                ? `Orden para ${currentOrder.table_number}`
                : ""}
            </SheetDescription>
          </SheetHeader>
          {currentOrder && (
            <CheckoutSheetContent
              currentOrder={currentOrder}
              onConfirm={onPay}
              onPrint={onPrint}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Cash register dialogs */}
      <RegisterOpeningDialog
        open={showOpeningDialog}
        onOpenChange={setShowOpeningDialog}
        shift={shift}
        onSubmit={handleOpenRegister}
      />
      <RegisterClosingDialog
        open={showClosingDialog}
        onOpenChange={setShowClosingDialog}
        register={register}
        onSubmit={handleCloseRegister}
        fetchBakeryStock={fetchBakeryStock}
      />
    </div>
  );
}

export default OrdersPage;
