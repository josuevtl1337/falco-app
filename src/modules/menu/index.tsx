import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./cmp/product-card";
import MenuItemForm from "./cmp/menu-item-form";
import { IMenuItem as Product } from "../../../backend/models/MenuModel.ts";
import { OrderProduct } from "../hall/index.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";

import BulkPriceModal from "./cmp/bulk-price-modal";

export type MenuViewProps = {
  products?: Product[];
  onSelect?: (product: Product) => void;
};

interface Props {
  pickProduct?: (product: OrderProduct) => void;
  updateProductQty?: (productId: string, qty: number) => void;
  onBack?: () => void;
  displayType?: "default" | "pick_items";
}

interface Category {
  category_id: string;
  name: string;
}

function MenuPage(props: Props) {
  const { onBack, pickProduct, updateProductQty } = props;
  const [query, setQuery] = useState<string>("");
  const [currentCat, setCurrentCat] = useState<string>("Todo");
  const [data, setData] = useState<OrderProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  useEffect(() => {
    // Cargar productos y categorías
    Promise.all([
      fetch("http://localhost:3001/api/get-menu-items"),
      fetch("http://localhost:3001/api/categories"),
    ])
      .then(([productsRes, categoriesRes]) =>
        Promise.all([productsRes.json(), categoriesRes.json()]),
      )
      .then(([productsData, categoriesData]) => {
        setData(productsData);
        setCategoriesList(categoriesData);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["Todo"]);
    if (data && data.length > 0) {
      data.forEach((p) => set.add(p.category_name ?? ""));
      return Array.from(set);
    }
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (data && data.length > 0) {
      return data
        .filter((p) =>
          currentCat === "Todo" ? true : p.category_name === currentCat,
        )
        .filter((p) =>
          q
            ? p.name.toLowerCase().includes(q) ||
              p.slug?.toLowerCase().includes(q)
            : true,
        );
    }
  }, [data, query, currentCat]);

  const handleAddProduct = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingItem(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/menu-items/${product.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar el producto");
      }

      toast.success("Producto eliminado correctamente");
      // Recargar la lista
      fetch("http://localhost:3001/api/get-menu-items")
        .then((res) => res.json())
        .then((data) => {
          setData(data);
        });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar el producto",
      );
    }
  };

  const handleFormSuccess = () => {
    // Recargar la lista de productos
    fetch("http://localhost:3001/api/get-menu-items")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      })
      .catch((err) => {
        console.error("Error reloading products:", err);
        toast.error("Error al recargar la lista de productos");
      });
  };

  return (
    <main className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div>
        <Button
          onClick={onBack}
          className="text-white bg-gray-700 rounded-lg px-3 py-1 mb-6 flex items-center gap-2 hover:bg-gray-600 transition"
        >
          <ArrowLeft size={18} />
          <span className="text-base font-medium">Volver</span>
        </Button>
      </div>
      <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white">Menú</h1>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o código (p. ej., ESP-2)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 py-3 rounded-xl bg-[#181c1f] border border-[var(--card-border)] text-white placeholder:text-gray-400"
            />
          </div>

        {!pickProduct && (
          <div className="flex gap-2">
              <Button
                variant="outline"
                className="hidden sm:inline-flex border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                onClick={() => setIsBulkModalOpen(true)}
              >
                Actualización Masiva
              </Button>
          
            <Button
              variant="default"
              className="hidden sm:inline-flex"
              onClick={handleAddProduct}
            >
              Agregar Producto
            </Button>
          </div>
        )}
        </div>

        <Tabs value={currentCat} onValueChange={setCurrentCat} className="">
          <ScrollArea className="mb-4 w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max gap-2 rounded-2xl bg-[#181c1f] p-1 shadow border border-[var(--card-border)]">
              {categories &&
                categories.length > 0 &&
                categories.map((c) => (
                  <TabsTrigger
                    key={c}
                    value={c}
                    className={cn(
                      "rounded-xl px-4 py-2 text-base font-semibold transition text-white data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white",
                    )}
                  >
                    {c}
                  </TabsTrigger>
                ))}
            </TabsList>
          </ScrollArea>
          <TabsContent value={currentCat} className="mt-2 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered &&
                filtered.length > 0 &&
                filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={pickProduct}
                    onUpdateQty={updateProductQty}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              {filtered && filtered.length > 0 && filtered.length === 0 && (
                <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-12">
                  No hay productos para mostrar.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MenuItemForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        categories={categoriesList}
        onSuccess={handleFormSuccess}
      />

      <BulkPriceModal
        open={isBulkModalOpen}
        onOpenChange={setIsBulkModalOpen}
        categories={categoriesList}
        products={data}
        onSuccess={handleFormSuccess}
      />
    </main>
  );
}

export default MenuPage;
