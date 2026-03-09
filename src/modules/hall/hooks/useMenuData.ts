import { useCallback, useEffect, useState } from "react";
import { IMenuItem as IProduct } from "backend/models/MenuModel";

export interface Category {
  category_id: string;
  name: string;
}

export interface OrderProduct extends IProduct {
  qty: number;
}

export interface UseMenuDataReturn {
  products: OrderProduct[];
  categories: Category[];
  loading: boolean;
  refetch: () => void;
}

export function useMenuData(): UseMenuDataReturn {
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("http://localhost:3001/api/get-menu-items"),
        fetch("http://localhost:3001/api/categories"),
      ]);
      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching menu data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, categories, loading, refetch: fetchData };
}
