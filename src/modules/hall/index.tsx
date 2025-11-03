import { useEffect, useState } from "react";
import MenuPage from "../menu";
import HallPage from "./cmp/hall/hall.page";
import CreateOrderState from "./cmp/states/create-order";
import { IMenuItem as IProduct } from "backend/models/MenuModel";
import SelectedProducts from "./cmp/pick-products/index";

export enum OrderState {
  CREATE_ORDER = "CREATE_ORDER",
  PICK_MENU = "PICK_MENU",
}

export interface OrderStateData {
  table_number: string;
  shift: string;
  status: string;
  discount_percentage: number;
  total_amount: number;
  items: {
    product_id: string;
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

  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [seat, setSeat] = useState<string>("");
  const [shift, setShift] = useState<string>("morning");

  const [orders, setOrders] = useState<OrderStateData[]>([]);

  const [currentOrder, setCurrentOrder] = useState<OrderStateData | null>(null);

  const handleStateChange = (newState: OrderState) => {
    setState(newState);
  };

  const addProduct = (product: OrderProduct) => {
    setProducts((prevProducts) => {
      const idx = prevProducts.findIndex((p) => p.id === product.id);
      if (idx > -1) {
        // Ya existe, suma qty
        const updated = [...prevProducts];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      // Nuevo producto
      return [...prevProducts, { ...product, qty: 1 }];
    });
  };

  const updateProductQty = (productId: string, qty: number) => {
    setProducts((prevProducts) =>
      prevProducts
        .map((p) => (p.id === productId ? { ...p, qty: Math.max(1, qty) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const clearProducts = () => {
    setProducts([]);
  };

  const removeProduct = (productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.id !== productId)
    );
  };

  const onCommand = () => {
    const body = {
      table_number: seat,
      shift: shift,
      status: "open",
      discount_percentage: 0,
      total_amount: products.reduce((acc, p) => acc + p.price * p.qty, 0),
      items: products.map((p) => ({
        product_id: p.id,
        quantity: p.qty,
        unit_price: p.price,
        subtotal: p.price * p.qty,
      })),
    };

    fetch("http://localhost:3001/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          // throw new Error("Network response was not ok");
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Order created with ID:", data.id);
        // Reset state after successful order creation
        getAllOrders();
        clearProducts();
        handleStateChange(OrderState.CREATE_ORDER);
      })
      .catch((err) => {
        console.error("Error creating order:", err);
      });
  }

  const renderCurrentState = () => {
    switch (state) {
      case OrderState.CREATE_ORDER:
        return (
          <CreateOrderState
            orders={orders}
            tableSelected={seat}
            onCreate={() => handleStateChange(OrderState.PICK_MENU)}
            getOrderById={getOrderById}
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
      default:
        return null;
    }
  };

  const getAllOrders = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/orders", {
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
      console.log("Open orders:", data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    getAllOrders();
  }, []);

  useEffect(() => {
    setState(OrderState.CREATE_ORDER);
    setProducts([]);
  }, [seat]);

  const getOrderById = async (tableNumber: string) => {
    const currentOrder = orders.filter((order) => order.table_number === tableNumber)[0];
    console.log("Current order:", currentOrder);

    setCurrentOrder(currentOrder)
    // return currentOrder;
  };

  return (
    <div
      className="h-[95vh] grid gap-4"
      style={{ gridTemplateColumns: "320px 1fr 360px" }}
    >
      <HallPage onChangeSeat={setSeat} onChangeShift={setShift} orders={orders} />

      <div className="h-full overflow-auto">{renderCurrentState()}</div>

      <div className="h-full overflow-auto">
        <SelectedProducts
          selectedProducts={products || currentOrder?.items.map(item => ({
            id: item.product_id,
            qty: item.quantity,
          }
          )) || []}
          onUpdateProductQty={updateProductQty}
          onRemoveProduct={removeProduct}
          onClearProducts={clearProducts}
          onCommand={onCommand}
        />
      </div>
    </div>
  );
}

export default OrdersPage;
