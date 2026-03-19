import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconPlus,
  IconPencil,
  IconPower,
  IconHistory,
  IconAlertTriangle,
  IconPackageOff,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useStockProducts, useMenuItems } from "../hooks/use-stock";
import type { StockProduct, StockMenuItemMap } from "../types";
import StockMovementsDialog from "./stock-movements-dialog";

const STOCK_API = "http://localhost:3001/api/stock";
const JSON_HEADERS = { "Content-Type": "application/json" };

function StockLevelBar({ current, threshold }: { current: number; threshold: number }) {
  const maxDisplay = Math.max(threshold * 3, current, 1);
  const percentage = Math.min((current / maxDisplay) * 100, 100);
  const isLow = current <= threshold && current > 0;
  const isEmpty = current === 0;

  let barColor = "from-emerald-500 to-emerald-400";
  if (isEmpty) barColor = "from-red-500 to-red-400";
  else if (isLow) barColor = "from-amber-500 to-amber-400";

  const thresholdPosition = Math.min((threshold / maxDisplay) * 100, 100);

  return (
    <div className="w-full">
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-muted-foreground/40"
          style={{ left: `${thresholdPosition}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-xs font-medium ${isEmpty ? "text-red-400" : isLow ? "text-amber-400" : "text-emerald-400"}`}>
          {current} uds
        </span>
        <span className="text-[10px] text-muted-foreground">
          umbral: {threshold}
        </span>
      </div>
    </div>
  );
}

function StockProductsTab() {
  const { products, refetch } = useStockProducts();
  const { menuItems } = useMenuItems();

  // Create / Edit dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    current_stock: "0",
    alert_threshold: "5",
  });

  // Mapping state
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<number[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState("");

  // Movements dialog
  const [movementsProductId, setMovementsProductId] = useState<number | null>(null);
  const [isMovementsOpen, setIsMovementsOpen] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Inline mappings display per product
  const [productMappings, setProductMappings] = useState<Record<number, StockMenuItemMap[]>>({});

  useEffect(() => {
    if (products.length === 0) return;

    async function loadAllMappings() {
      const mappingsMap: Record<number, StockMenuItemMap[]> = {};
      for (const product of products) {
        try {
          const res = await fetch(`${STOCK_API}/products/${product.id}/mappings`);
          mappingsMap[product.id] = res.ok ? await res.json() : [];
        } catch {
          mappingsMap[product.id] = [];
        }
      }
      setProductMappings(mappingsMap);
    }

    loadAllMappings();
  }, [products]);

  const filteredMenuItems = useMemo(() => {
    const active = menuItems.filter((mi) => mi.is_active);
    if (!menuSearchTerm.trim()) return active;
    const term = menuSearchTerm.toLowerCase();
    return active.filter(
      (mi) =>
        mi.name.toLowerCase().includes(term) ||
        (mi.category_name && mi.category_name.toLowerCase().includes(term))
    );
  }, [menuItems, menuSearchTerm]);

  function resetForm() {
    setFormData({ name: "", current_stock: "0", alert_threshold: "5" });
    setSelectedMenuItemIds([]);
    setEditingProduct(null);
    setMenuSearchTerm("");
  }

  function openCreateDialog() {
    resetForm();
    setIsFormOpen(true);
  }

  async function openEditDialog(product: StockProduct) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      current_stock: product.current_stock.toString(),
      alert_threshold: product.alert_threshold.toString(),
    });
    setMenuSearchTerm("");

    setLoadingMappings(true);
    try {
      const res = await fetch(`${STOCK_API}/products/${product.id}/mappings`);
      if (res.ok) {
        const mappings: StockMenuItemMap[] = await res.json();
        setSelectedMenuItemIds(mappings.map((m) => m.menu_item_id));
      }
    } catch {
      setSelectedMenuItemIds([]);
    }
    setLoadingMappings(false);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `${STOCK_API}/products/${editingProduct.id}`
        : `${STOCK_API}/products`;
      const method = editingProduct ? "PUT" : "POST";

      const body = editingProduct
        ? { name: formData.name, alert_threshold: parseInt(formData.alert_threshold) }
        : { name: formData.name, alert_threshold: parseInt(formData.alert_threshold), current_stock: parseInt(formData.current_stock) };

      const res = await fetch(url, {
        method,
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || "Error al guardar producto");
        return;
      }

      const productId = editingProduct ? editingProduct.id : (await res.json()).id;

      // Save mappings
      await fetch(`${STOCK_API}/products/${productId}/mappings`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ menu_item_ids: selectedMenuItemIds }),
      });

      // Adjust stock if editing and quantity changed
      if (editingProduct) {
        const newQty = parseInt(formData.current_stock);
        if (!isNaN(newQty) && newQty >= 0 && newQty !== editingProduct.current_stock) {
          await fetch(`${STOCK_API}/products/${editingProduct.id}/adjust`, {
            method: "PATCH",
            headers: JSON_HEADERS,
            body: JSON.stringify({
              new_quantity: newQty,
              reason: "Corrección manual",
            }),
          });
        }
      }

      toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
      setIsFormOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("Error al guardar producto");
    }
  }

  async function handleToggleActive(product: StockProduct) {
    try {
      const res = await fetch(`${STOCK_API}/products/${product.id}/active`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ active: !product.active }),
      });
      if (!res.ok) {
        toast.error("Error al cambiar estado");
        return;
      }
      toast.success(product.active ? "Producto desactivado" : "Producto activado");
      refetch();
    } catch {
      toast.error("Error al cambiar estado");
    }
  }

  function toggleMenuItem(menuItemId: number) {
    setSelectedMenuItemIds((prev) =>
      prev.includes(menuItemId)
        ? prev.filter((id) => id !== menuItemId)
        : [...prev, menuItemId]
    );
  }

  function isLowStock(product: StockProduct) {
    return product.current_stock <= product.alert_threshold;
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute stock diff for the edit dialog
  const stockDiff = editingProduct
    ? parseInt(formData.current_stock) - editingProduct.current_stock
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto de stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreateDialog} className="gap-1.5">
          <IconPlus size={16} />
          Agregar Producto
        </Button>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <IconPackageOff size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No se encontraron productos de stock
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const lowStock = isLowStock(product) && !!product.active;
            const outOfStock = product.current_stock === 0 && !!product.active;
            const mappings = productMappings[product.id] ?? [];

            let cardBorder = "border-border/50";
            let cardBg = "";
            if (outOfStock) {
              cardBorder = "border-red-500/40";
              cardBg = "bg-gradient-to-br from-red-500/5 to-transparent";
            } else if (lowStock) {
              cardBorder = "border-amber-500/30";
              cardBg = "bg-gradient-to-br from-amber-500/5 to-transparent";
            }

            return (
              <Card
                key={product.id}
                className={`${cardBorder} ${cardBg} hover:shadow-md transition-all duration-200 ${!product.active ? "opacity-50" : ""}`}
              >
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  {/* Product header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {product.name}
                        </h3>
                        {outOfStock && (
                          <span className="shrink-0 flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-red-400 text-[10px] font-bold uppercase animate-pulse">
                            <IconPackageOff size={10} />
                            Agotado
                          </span>
                        )}
                        {lowStock && !outOfStock && (
                          <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-400 text-[10px] font-semibold">
                            <IconAlertTriangle size={10} />
                            Bajo
                          </span>
                        )}
                      </div>
                      {/* Mappings */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {mappings.length > 0
                          ? mappings.map((m) => (
                              <Badge key={m.id} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {m.menu_item_name}
                              </Badge>
                            ))
                          : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Sin ítems asociados
                            </span>
                          )
                        }
                      </div>
                    </div>
                    <Badge
                      variant={product.active ? "default" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {/* Stock level bar */}
                  <StockLevelBar
                    current={product.current_stock}
                    threshold={product.alert_threshold}
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      title="Editar producto"
                      onClick={() => openEditDialog(product)}
                    >
                      <IconPencil size={14} />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      title="Historial"
                      onClick={() => {
                        setMovementsProductId(product.id);
                        setIsMovementsOpen(true);
                      }}
                    >
                      <IconHistory size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title={product.active ? "Desactivar" : "Activar"}
                      onClick={() => handleToggleActive(product)}
                    >
                      <IconPower
                        size={14}
                        className={product.active ? "text-green-500" : "text-muted-foreground"}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog (unified with stock adjustment) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto de Stock"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Modifica el producto, ajustá el stock y gestioná ítems asociados"
                : "Crea un producto de stock y asociá ítems del menú"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Medialunas Dulces"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_stock">
                  {editingProduct ? "Cantidad Real" : "Stock Inicial"}
                </Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                />
                {editingProduct && formData.current_stock !== "" && !isNaN(stockDiff) && stockDiff !== 0 && (
                  <p className="text-xs mt-1">
                    {stockDiff > 0
                      ? <span className="text-emerald-400 font-medium">+{stockDiff} unidades</span>
                      : <span className="text-red-400 font-medium">{stockDiff} unidades</span>
                    }
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="alert_threshold">Umbral de Alerta</Label>
                <Input
                  id="alert_threshold"
                  type="number"
                  min="0"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Ítems del Menú Asociados</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Cuando se venda cualquiera de estos ítems, se restará 1 unidad de stock
              </p>
              {loadingMappings ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar ítem de la carta..."
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                      {filteredMenuItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No se encontraron ítems
                        </p>
                      ) : (
                        filteredMenuItems.map((mi) => (
                          <label
                            key={mi.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
                          >
                            <Checkbox
                              checked={selectedMenuItemIds.includes(mi.id)}
                              onCheckedChange={() => toggleMenuItem(mi.id)}
                            />
                            <span className="text-sm">{mi.name}</span>
                            {mi.category_name && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {mi.category_name}
                              </span>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
              {selectedMenuItemIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedMenuItemIds.length} ítem(s) seleccionado(s)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <StockMovementsDialog
        productId={movementsProductId}
        open={isMovementsOpen}
        onOpenChange={setIsMovementsOpen}
      />
    </div>
  );
}

export default StockProductsTab;
