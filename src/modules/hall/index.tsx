import { useCallback, useEffect, useState } from "react";
import MenuPage from "../menu";
import HallPage from "./cmp/hall/hall.page";
import CreateOrderState from "./cmp/states/create-order";
import { IMenuItem as IProduct } from "backend/models/MenuModel";
import SelectedProducts from "./cmp/pick-products/index";
import { toast } from "sonner";
import CheckoutView from "./cmp/checkout/checkout-view";
import { PaymentData } from "./cmp/checkout/payment-section";

export enum OrderState {
  CREATE_ORDER = "CREATE_ORDER",
  PICK_MENU = "PICK_MENU",
  CHECKOUT_VIEW = "CHECKOUT_VIEW",
}

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
  const [state, setState] = useState<OrderState>(OrderState.CREATE_ORDER);

  const [seat, setSeat] = useState<string>("");
  const [shift, setShift] = useState<string>("morning");

  const [orders, setOrders] = useState<OrderStateData[]>([]);

  const [currentOrder, setCurrentOrder] = useState<OrderStateData | null>(null);
  console.log("currentOrder", currentOrder);
  const handleStateChange = (newState: OrderState) => {
    setState(newState);
  };

  const computeSubtotal = (items: OrderStateData["items"]) =>
    items.reduce((acc, p) => acc + p.unit_price * p.quantity, 0);

  const makeOrderItem = (product: OrderProduct) => ({
    menu_item_id: product.id,
    menu_item_name: product.name,
    quantity: 1,
    unit_price: product.price,
    subtotal: product.price,
  });

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
    [seat, shift]
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

  const onChangeSteat = useCallback(
    (tableNumber: string) => {
      setSeat(tableNumber);
      const found = orders.find((o) => o.table_number === tableNumber) ?? null;
      setCurrentOrder(found);
    },
    [orders]
  );

  const onCommand = useCallback(async () => {
    if (!currentOrder) return;
    const body = {
      table_number: seat,
      shift,
      status: "open",
      discount_percentage: currentOrder.discount_percentage || 0,
      total_amount: computeSubtotal(currentOrder.items),
      items: currentOrder.items.map((p) => ({
        product_id: p.menu_item_id,
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
      handleStateChange(OrderState.CREATE_ORDER);
    } catch (err) {
      console.error("Error creating order:", err);
    }
  }, [currentOrder, seat, shift]);

  const onPay = useCallback(
    async (paymentData: PaymentData) => {
      console.log("currentOrder", currentOrder?.id);
      if (!currentOrder) return;
      const body = {
        payment_method_id: paymentData.paymentMethod.id,
        discount_percentage: paymentData.discountValue,
        total_amount: paymentData.total_amount,
      };
      try {
        const res = await fetch(
          `http://localhost:3001/api/orders/${currentOrder.id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              body: JSON.stringify(body),
            },
          }
        );
        if (!res.ok) throw new Error("Network response was not ok");
        toast.success("Se ha cobrado exitosamente :) ");
        setSeat("");
        setCurrentOrder(null);
        await getAllOrders();
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    },
    [currentOrder]
  );

  const onEditCommand = useCallback(async () => {
    if (!currentOrder) return;
    const body = {
      id: currentOrder.id,
      table_number: currentOrder.table_number,
      shift: currentOrder.shift,
      status: currentOrder.status,
      discount_percentage: currentOrder.discount_percentage || 0,
      total_amount: computeSubtotal(currentOrder.items),
      items: currentOrder.items.map((p) => ({
        product_id: p.menu_item_id,
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

  const renderCurrentState = () => {
    switch (state) {
      case OrderState.CREATE_ORDER:
        return (
          <CreateOrderState
            orders={orders}
            tableSelected={seat}
            onCreate={() => handleStateChange(OrderState.PICK_MENU)}
            viewCommand={viewCommand}
          />
        );
      case OrderState.PICK_MENU:
        return (
          <MenuPage
            onBack={() => handleStateChange(OrderState.CREATE_ORDER)}
            pickProduct={addProduct}
            updateProductQty={updateProductQty}
          />
        );
      case OrderState.CHECKOUT_VIEW:
        if (!currentOrder) return null;
        return (
          <CheckoutView
            orderLabel={`Orden para ${currentOrder.table_number}`}
            items={
              currentOrder.items.map((it) => ({
                id: String(it.menu_item_id),
                name: it.menu_item_name,
                qty: it.quantity,
                price: it.unit_price,
                subtotal: it.subtotal,
              })) || []
            }
            subtotal={
              currentOrder.total_amount -
              (currentOrder.discount_percentage || 0)
            }
            discount={0}
            total={currentOrder.total_amount}
            onClose={() => handleStateChange(OrderState.CREATE_ORDER)}
            onConfirm={onPay}
          />
        );
      default:
        return null;
    }
  };

  const getAllOrders = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/get-orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
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

  useEffect(() => {
    setState(OrderState.CREATE_ORDER);
  }, [seat]);

  const viewCommand = async () => {
    setState(OrderState.PICK_MENU);
  };

  return (
    <div
      className="h-[95vh] grid gap-4"
      style={{ gridTemplateColumns: "320px 1fr 360px" }}
    >
      <HallPage
        onChangeSeat={onChangeSteat}
        onChangeShift={setShift}
        orders={orders}
      />

      <div className="h-full overflow-auto">{renderCurrentState()}</div>

      <div className="h-full overflow-auto">
        {seat && (
          <SelectedProducts
            selectedProducts={
              currentOrder
                ? currentOrder.items.map((item) => ({
                    id: item.menu_item_id,
                    qty: item.quantity,
                    name: item.menu_item_name,
                    price: item.unit_price,
                    subtotal: item.subtotal,
                  })) || []
                : []
            }
            onUpdateProductQty={updateProductQty}
            onRemoveProduct={removeProduct}
            onClearProducts={clearProducts}
            isReadyToPay={currentOrder?.status === "open" || false}
            onCommand={onCommand}
            onSave={onEditCommand}
            onPay={() => handleStateChange(OrderState.CHECKOUT_VIEW)}
          />
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
