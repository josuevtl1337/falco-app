import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getCategoryStyle } from "@/modules/commons/constants/category-styles";
import type { OrderProduct, Category } from "@/modules/hall/hooks/useMenuData";
import PosProductCard from "./pos-product-card";

interface PosMenuGridProps {
  products: OrderProduct[];
  categories: Category[];
  onSelectProduct: (product: OrderProduct) => void;
  disabled?: boolean;
}

function PosMenuGrid({
  products,
  categories,
  onSelectProduct,
  disabled,
}: PosMenuGridProps) {
  const [query, setQuery] = useState("");
  const [currentCat, setCurrentCat] = useState("Todo");
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const categoryNames = useMemo(() => {
    const names = ["Todo"];
    categories.forEach((c) => {
      if (c.name && !names.includes(c.name)) names.push(c.name);
    });
    return names;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) =>
        currentCat === "Todo" ? true : p.category_name === currentCat
      )
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) ||
            (p.slug?.toLowerCase().includes(q) ?? false)
          : true
      );
  }, [products, query, currentCat]);

  const handleSelect = (product: OrderProduct) => {
    if (disabled) {
      toast.info("Selecciona una mesa primero");
      return;
    }
    onSelectProduct(product);
  };

  return (
    <div className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-4 flex flex-col gap-3 overflow-hidden">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={searchRef}
          placeholder="Buscar producto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 py-2.5 rounded-xl bg-[#181c1f] border border-[var(--card-border)] text-white placeholder:text-gray-500 text-sm"
        />
      </div>

      {/* Category tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-1.5 pb-1">
          {categoryNames.map((name) => {
            const style = getCategoryStyle(name === "Todo" ? undefined : name);
            const isActive = currentCat === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCurrentCat(name)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? "text-white border border-white/20"
                    : "text-gray-400 border border-transparent hover:text-white hover:border-[var(--card-border)]"
                )}
                style={
                  isActive
                    ? { backgroundColor: style.bgTint, borderColor: style.borderColor }
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
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 pr-2">
          {filtered.map((p) => (
            <PosProductCard
              key={p.id}
              product={p}
              onSelect={handleSelect}
              disabled={disabled}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12 text-sm">
              No hay productos para mostrar.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default PosMenuGrid;
