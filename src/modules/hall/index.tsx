import { useState } from "react";
import MenuPage from "../menu";
import HallPage from "./cmp/hall/hall.page";
import CreateOrderState from "./cmp/states/create-order";
import { IMenuItem as IProduct } from "backend/models/MenuModel";
import SelectedProducts from "./cmp/pick-products/index";

export enum OrderState {
  CREATE_ORDER = "CREATE_ORDER",
  PICK_MENU = "PICK_MENU",
}

export interface OrderProduct extends IProduct {
  qty: number;
}

function OrdersPage() {
  const [state, setState] = useState<OrderState>(OrderState.CREATE_ORDER);

  const [products, setProducts] = useState<OrderProduct[]>([]);

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

  const renderCurrentState = () => {
    switch (state) {
      case OrderState.CREATE_ORDER:
        return (
          <CreateOrderState
            onCreate={() => handleStateChange(OrderState.PICK_MENU)}
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

  return (
    <div className="h-[92vh] grid grid-cols-4 gap-4">
      <div className="col-span-1">
        <HallPage />
      </div>

      <div className="col-span-2">{renderCurrentState()}</div>

      <div className="col-span-1">
        <SelectedProducts
          selectedProducts={products}
          onUpdateProductQty={updateProductQty}
          onRemoveProduct={removeProduct}
          onClearProducts={clearProducts}
        />
      </div>
    </div>
  );
}

export default OrdersPage;
