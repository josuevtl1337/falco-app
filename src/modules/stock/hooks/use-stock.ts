import { useState, useEffect, useCallback } from "react";
import type {
  StockProduct,
  StockMovement,
  LowStockAlert,
  MenuItem,
  StockMenuItemMap,
} from "../types";

const STOCK_API = "http://localhost:3001/api/stock";
const MENU_API = "http://localhost:3001/api/get-menu-items";

export function useStockProducts() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${STOCK_API}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProducts(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(MENU_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMenuItems(await res.json());
    } catch {
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  return { menuItems, loading };
}

export function useStockMappings(stockProductId: number | null) {
  const [mappings, setMappings] = useState<StockMenuItemMap[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMappings = useCallback(async () => {
    if (!stockProductId) {
      setMappings([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${STOCK_API}/products/${stockProductId}/mappings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMappings(await res.json());
    } catch {
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, [stockProductId]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  return { mappings, loading, refetch: fetchMappings };
}

export function useLowStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${STOCK_API}/alerts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAlerts(await res.json());
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, loading, refetch: fetchAlerts };
}

export function useStockMovements(stockProductId?: number) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const url = stockProductId
        ? `${STOCK_API}/products/${stockProductId}/movements`
        : `${STOCK_API}/movements`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMovements(await res.json());
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [stockProductId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return { movements, loading, refetch: fetchMovements };
}
