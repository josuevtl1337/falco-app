import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconTruck,
  IconLeaf,
  IconToolsKitchen2,
  IconTag,
  IconReceipt,
  IconRefresh,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import RawMaterialsTab from "./components/raw-materials-tab";
import SuppliersTab from "./components/suppliers-tab";
import RecipesTab from "./components/recipes-tab";
import ProductsTab from "./components/products-tab";
import FixedCostsTab from "./components/fixed-costs-tab";

const API_BASE = "http://localhost:3001/api/cost-engine";

function CostEnginePage() {
  const [counts, setCounts] = useState({
    suppliers: 0,
    materials: 0,
    recipes: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);

  async function fetchCounts() {
    setLoading(true);
    try {
      const [suppRes, matRes, recRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/suppliers`),
        fetch(`${API_BASE}/raw-materials`),
        fetch(`${API_BASE}/recipes`),
        fetch(`${API_BASE}/products`),
      ]);
      const [suppliers, materials, recipes, products] = await Promise.all([
        suppRes.json(),
        matRes.json(),
        recRes.json(),
        prodRes.json(),
      ]);
      setCounts({
        suppliers: suppliers.length,
        materials: materials.length,
        recipes: recipes.length,
        products: products.length,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  const kpis = [
    {
      label: "Proveedores",
      value: String(counts.suppliers),
      icon: IconTruck,
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/20",
    },
    {
      label: "Materias primas",
      value: String(counts.materials),
      icon: IconLeaf,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20",
    },
    {
      label: "Recetas",
      value: String(counts.recipes),
      icon: IconToolsKitchen2,
      color: "text-purple-400",
      bg: "from-purple-500/10 to-purple-500/5",
      border: "border-purple-500/20",
    },
    {
      label: "Productos",
      value: String(counts.products),
      icon: IconTag,
      color: "text-amber-400",
      bg: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Motor de Costos
            </h1>
            <IconCurrencyDollar size={22} className="text-emerald-400" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona materias primas, recetas y calcula precios de carta
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCounts}
          disabled={loading}
          className="gap-1.5"
        >
          <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      {loading && counts.suppliers === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className={`bg-gradient-to-br ${kpi.bg} ${kpi.border} hover:scale-[1.02] transition-transform duration-200`}
            >
              <CardContent className="pt-4 pb-3 px-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div className={`text-2xl font-bold ${kpi.color}`}>
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="raw-materials" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suppliers" className="gap-1.5">
            <IconTruck size={16} />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="raw-materials" className="gap-1.5">
            <IconLeaf size={16} />
            Materias Primas
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-1.5">
            <IconToolsKitchen2 size={16} />
            Recetas
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <IconTag size={16} />
            Productos
          </TabsTrigger>
          <TabsTrigger value="fixed-costs" className="gap-1.5">
            <IconReceipt size={16} />
            Gastos Fijos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-6">
          <SuppliersTab />
        </TabsContent>

        <TabsContent value="raw-materials" className="mt-6">
          <RawMaterialsTab />
        </TabsContent>

        <TabsContent value="recipes" className="mt-6">
          <RecipesTab />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="fixed-costs" className="mt-6">
          <FixedCostsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CostEnginePage;
