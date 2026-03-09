import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import ProductCard from "./cmp/product-card";
import MenuItemForm from "./cmp/menu-item-form";
import { IMenuItem as Product } from "../../../backend/models/MenuModel.ts";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import BulkPriceModal from "./cmp/bulk-price-modal";
import { useMenuData } from "@/modules/hall/hooks/useMenuData";
import { getCategoryStyle } from "@/modules/commons/constants/category-styles";

function MenuPage() {
  const [query, setQuery] = useState("");
  const [currentCat, setCurrentCat] = useState("Todo");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  const { products: data, categories: categoriesList, refetch } = useMenuData();

  const categoryNames = useMemo(() => {
    const names = ["Todo"];
    categoriesList.forEach((c) => {
      if (c.name && !names.includes(c.name)) names.push(c.name);
    });
    return names;
  }, [categoriesList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((p) =>
        currentCat === "Todo" ? true : p.category_name === currentCat
      )
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) ||
            (p.slug?.toLowerCase().includes(q) ?? false)
          : true
      );
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
        `¿Estás seguro de que quieres eliminar "${product.name}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/menu-items/${product.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar el producto");
      }

      toast.success("Producto eliminado correctamente");
      refetch();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar el producto"
      );
    }
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <main className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Menú
          </h1>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar producto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 py-3 rounded-xl bg-[#181c1f] border border-[var(--card-border)] text-white placeholder:text-gray-500"
            />
          </div>

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
        </div>

        {/* Category tabs */}
        <ScrollArea className="mb-4 w-full whitespace-nowrap">
          <div className="flex gap-2 pb-1">
            {categoryNames.map((name) => {
              const style = getCategoryStyle(
                name === "Todo" ? undefined : name
              );
              const isActive = currentCat === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCurrentCat(name)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border",
                    isActive
                      ? "text-white border-white/20"
                      : "text-gray-400 border-transparent hover:text-white hover:border-[var(--card-border)]"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: style.bgTint,
                          borderColor: style.borderColor,
                        }
                      : undefined
                  }
                >
                  <span>{name === "Todo" ? "🍽️" : style.emoji}</span>
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Product grid */}
        <div className="mt-2 flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-12">
                No hay productos para mostrar.
              </div>
            )}
          </div>
        </div>
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
