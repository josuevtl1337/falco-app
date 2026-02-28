import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, PackagePlus, Power, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { useStockProducts, useMenuItems } from "../hooks/use-stock";
import type { StockProduct, StockMenuItemMap } from "../types";
import StockMovementsDialog from "./stock-movements-dialog";

const STOCK_API = "http://localhost:3001/api/stock";

const JSON_HEADERS = { "Content-Type": "application/json" };

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

  // Replenish dialog
  const [replenishProduct, setReplenishProduct] = useState<StockProduct | null>(null);
  const [replenishQty, setReplenishQty] = useState("");
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);

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

  function resetForm() {
    setFormData({ name: "", current_stock: "0", alert_threshold: "5" });
    setSelectedMenuItemIds([]);
    setEditingProduct(null);
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

      await fetch(`${STOCK_API}/products/${productId}/mappings`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ menu_item_ids: selectedMenuItemIds }),
      });

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

  async function handleReplenish(e: React.FormEvent) {
    e.preventDefault();
    if (!replenishProduct) return;

    const qty = parseInt(replenishQty);
    if (!qty || qty <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    try {
      const res = await fetch(`${STOCK_API}/products/${replenishProduct.id}/replenish`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ quantity: qty }),
      });
      if (!res.ok) {
        toast.error("Error al reponer stock");
        return;
      }
      toast.success(`Stock repuesto: +${qty} unidades de ${replenishProduct.name}`);
      setIsReplenishOpen(false);
      setReplenishQty("");
      setReplenishProduct(null);
      refetch();
    } catch {
      toast.error("Error al reponer stock");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Productos de Stock</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Producto" : "Nuevo Producto de Stock"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Modifica el producto y sus ítems del menú asociados"
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
                {!editingProduct && (
                  <div>
                    <Label htmlFor="current_stock">Stock Inicial</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    />
                  </div>
                )}
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
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                      {menuItems
                        .filter((mi) => mi.is_active)
                        .map((mi) => (
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
                        ))}
                    </div>
                  </ScrollArea>
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
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar producto de stock..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Stock Actual</TableHead>
            <TableHead>Umbral</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ítems Asociados</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No se encontraron productos de stock
              </TableCell>
            </TableRow>
          ) : (
            filteredProducts.map((product) => {
              const lowStock = isLowStock(product) && !!product.active;
              return (
                <TableRow key={product.id} className={lowStock ? "bg-destructive/10" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {product.name}
                      {lowStock && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={lowStock ? "text-destructive font-bold" : ""}>
                      {product.current_stock}
                    </span>
                  </TableCell>
                  <TableCell>{product.alert_threshold}</TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(productMappings[product.id] ?? []).length > 0
                        ? productMappings[product.id].map((m) => (
                            <Badge key={m.id} variant="outline" className="text-xs">
                              {m.menu_item_name}
                            </Badge>
                          ))
                        : <span className="text-xs text-muted-foreground">Sin mapeos</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Reponer stock"
                        onClick={() => {
                          setReplenishProduct(product);
                          setReplenishQty("");
                          setIsReplenishOpen(true);
                        }}
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Historial"
                        onClick={() => {
                          setMovementsProductId(product.id);
                          setIsMovementsOpen(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={product.active ? "Desactivar" : "Activar"}
                        onClick={() => handleToggleActive(product)}
                      >
                        <Power
                          className={`h-4 w-4 ${product.active ? "text-green-500" : "text-muted-foreground"}`}
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={isReplenishOpen} onOpenChange={setIsReplenishOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reponer Stock</DialogTitle>
            <DialogDescription>
              {replenishProduct
                ? `${replenishProduct.name} — Stock actual: ${replenishProduct.current_stock}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReplenish} className="space-y-4">
            <div>
              <Label htmlFor="replenish_qty">Cantidad a agregar</Label>
              <Input
                id="replenish_qty"
                type="number"
                min="1"
                value={replenishQty}
                onChange={(e) => setReplenishQty(e.target.value)}
                placeholder="Ej: 24"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsReplenishOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Reponer</Button>
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
