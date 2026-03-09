import { useState, useCallback, useEffect } from "react";
import type {
  CashRegisterShift,
  OpeningPayload,
  ClosingPayload,
} from "../types/cash-register";

interface CashRegisterState {
  isOpen: boolean;
  register: CashRegisterShift | null;
  bakeryProducts: string[];
  loading: boolean;
  estimatedCash: number;
  estimatedBank: number;
}

export function useCashRegister() {
  const [state, setState] = useState<CashRegisterState>({
    isOpen: false,
    register: null,
    bakeryProducts: [],
    loading: true,
    estimatedCash: 0,
    estimatedBank: 0,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/cash-register/status");
      if (!res.ok) throw new Error("Error fetching cash register status");
      const data = await res.json();
      setState({
        isOpen: data.register !== null,
        register: data.register,
        bakeryProducts: data.bakeryProducts,
        loading: false,
        estimatedCash: data.estimatedCash ?? 0,
        estimatedBank: data.estimatedBank ?? 0,
      });
    } catch (err) {
      console.error("Error fetching cash register status:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const openRegister = useCallback(
    async (payload: OpeningPayload): Promise<CashRegisterShift> => {
      const res = await fetch("http://localhost:3001/api/cash-register/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error opening cash register");
      }

      const register = await res.json();
      setState((prev) => ({
        ...prev,
        isOpen: true,
        register,
      }));
      return register;
    },
    []
  );

  const closeRegister = useCallback(
    async (payload: ClosingPayload): Promise<CashRegisterShift> => {
      const res = await fetch("http://localhost:3001/api/cash-register/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error closing cash register");
      }

      const register = await res.json();
      setState((prev) => ({
        ...prev,
        isOpen: false,
        register: null,
      }));
      return register;
    },
    []
  );

  const fetchBakeryStock = useCallback(async (): Promise<
    Record<string, number>
  > => {
    const res = await fetch("http://localhost:3001/api/cash-register/bakery-stock");
    if (!res.ok) throw new Error("Error fetching bakery stock");
    return await res.json();
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...state,
    fetchStatus,
    openRegister,
    closeRegister,
    fetchBakeryStock,
  };
}
