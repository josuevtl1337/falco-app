import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./cmp/product-card";
import { IMenuItem as Product } from "../../../backend/models/MenuModel.ts";

export type MenuViewProps = {
  products?: Product[];
  onSelect?: (product: Product) => void;
};

interface Props {}

function MenuPage(props: Props) {
  const {} = props;
  const [query, setQuery] = useState<string>("");
  const [currentCat, setCurrentCat] = useState<string>("Todo");
  const [data, setData] = useState<Product[]>([]);

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
    data.forEach((p) => set.add(p.category_name));
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
          ? p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
          : true
      );
  }, [data, query, currentCat]);

  return (
    <main className="min-h-screen py-8 px-2">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--primary)]">
            Menú de Productos
          </h1>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nombre o código (p. ej., ESP-2)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 py-3 rounded-xl bg-white"
            />
          </div>
        </div>

        <Tabs value={currentCat} onValueChange={setCurrentCat} className="">
          <ScrollArea className="mb-5 w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto w-max gap-2 rounded-2xl bg-blue-100/60 dark:bg-gray-800/60 p-1 shadow">
              {categories.map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className={cn(
                    "rounded-xl px-4 py-2 text-base font-semibold transition"
                  )}
                >
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          <TabsContent value={currentCat} className="mt-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onSelect={() => {}} />
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
