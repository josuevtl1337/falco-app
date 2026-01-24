import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import StockTable from "./components/stock-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import AddStockModal from "./components/add-stock-modal";

export interface StockItem {
  id: number;
  name: string;
  purchase_unit: string;
  stock_quantity: number;
  min_stock: number;
  status: "normal" | "low";
  supplier_name?: string;
}

function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/stock");
      if (!response.ok) throw new Error("Error fetching stock");
      const data = await response.json();
      setStock(data);
    } catch (error) {
      console.error("Error fetching stock:", error);
      toast.error("Error al cargar el stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleAddStock = async (quantity: number, notes?: string) => {
    if (!selectedItem) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/stock/${selectedItem.id}/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity, notes }),
        }
      );

      if (!response.ok) throw new Error("Error adding stock");

      toast.success(`Stock agregado: +${quantity} ${selectedItem.purchase_unit}`);
      setModalOpen(false);
      setSelectedItem(null);
      fetchStock();
    } catch (error) {
      console.error("Error adding stock:", error);
      toast.error("Error al agregar stock");
    }
  };

  const handleUpdateStock = async (
    id: number,
    stockQuantity: number,
    minStock: number
  ) => {
    try {
      const response = await fetch(`http://localhost:3001/api/stock/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_quantity: stockQuantity, min_stock: minStock }),
      });

      if (!response.ok) throw new Error("Error updating stock");

      toast.success("Stock actualizado");
      fetchStock();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Error al actualizar stock");
    }
  };

  const openAddModal = (item: StockItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const filteredStock =
    filter === "all" ? stock : stock.filter((item) => item.status === "low");

  const lowStockCount = stock.filter((item) => item.status === "low").length;

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--primary-text)]">
          Control de Stock
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona el inventario de insumos del café
        </p>
      </div>

      {/* Stats and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todos ({stock.length})
          </Button>
          <Button
            variant={filter === "low" ? "destructive" : "outline"}
            onClick={() => setFilter("low")}
            className="flex items-center gap-2"
          >
            <IconAlertTriangle size={16} />
            Bajo Stock ({lowStockCount})
          </Button>
        </div>

        <Button variant="outline" onClick={fetchStock} disabled={loading}>
          <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
          <span className="ml-2">Actualizar</span>
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <IconAlertTriangle className="text-red-600" size={24} />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">
              ¡Atención! Hay {lowStockCount} insumos con bajo stock
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">
              Revisa y repone los insumos marcados en rojo
            </p>
          </div>
          <Badge variant="destructive" className="ml-auto">
            {lowStockCount} items
          </Badge>
        </div>
      )}

      {/* Stock Table */}
      <StockTable
        items={filteredStock}
        loading={loading}
        onAddStock={openAddModal}
        onUpdateStock={handleUpdateStock}
      />

      {/* Add Stock Modal */}
      <AddStockModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={selectedItem}
        onConfirm={handleAddStock}
      />
    </main>
  );
}

export default StockPage;
