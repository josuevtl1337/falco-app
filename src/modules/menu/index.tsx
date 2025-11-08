import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./cmp/product-card";
import { IMenuItem as Product } from "../../../backend/models/MenuModel.ts";
import { OrderProduct } from "../hall/index.tsx";

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

function MenuPage(props: Props) {
  const { onBack, pickProduct, updateProductQty } = props;
  const [query, setQuery] = useState<string>("");
  const [currentCat, setCurrentCat] = useState<string>("Todo");
  const [data, setData] = useState<OrderProduct[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/get-menu-items")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["Todo"]);
    data.forEach((p) => set.add(p.category_name ?? ""));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((p) =>
        currentCat === "Todo" ? true : p.category_name === currentCat
      )
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q)
          : true
      );
  }, [data, query, currentCat]);

  return (
    <main className="h-full bg-[var(--card-background)] rounded-2xl border border-[var(--card-border)] p-6 flex flex-col">
      <div>
        <button
          onClick={onBack}
          className="text-white bg-gray-700 rounded-lg px-3 py-1 mb-6 flex items-center gap-2 hover:bg-gray-600 transition"
        >
          <ArrowLeft size={18} />
          <span className="text-base font-medium">Volver</span>
        </button>
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
        </div>

        <Tabs value={currentCat} onValueChange={setCurrentCat} className="">
          <ScrollArea className="mb-4 w-full whitespace-nowrap">
            <TabsList className="inline-flex w-max gap-2 rounded-2xl bg-[#181c1f] p-1 shadow border border-[var(--card-border)]">
              {categories.map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className={cn(
                    "rounded-xl px-4 py-2 text-base font-semibold transition text-white data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"
                  )}
                >
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          <TabsContent value={currentCat} className="mt-2 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={pickProduct}
                  onUpdateQty={updateProductQty}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-12">
                  No hay productos para mostrar.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default MenuPage;
