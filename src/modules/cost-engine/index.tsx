import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RawMaterialsTab from "./components/raw-materials-tab";
import SuppliersTab from "./components/suppliers-tab";
import RecipesTab from "./components/recipes-tab";
import ProductsTab from "./components/products-tab";
import FixedCostsTab from "./components/fixed-costs-tab";

function CostEnginePage() {
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--primary-text)]">
          Motor de Costos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona materias primas, recetas y calcula precios de carta
        </p>
      </div>

      <Tabs defaultValue="raw-materials" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="raw-materials">Materias Primas</TabsTrigger>
          <TabsTrigger value="recipes">Recetas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="fixed-costs">Gastos Fijos</TabsTrigger>
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
    </main>
  );
}

export default CostEnginePage;
