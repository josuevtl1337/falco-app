import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconBasket,
  IconChefHat,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconPower,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useMenuItems, useVitrineStockItems } from "../hooks/use-stock";
import type { VitrineStockItem } from "../types";

const STOCK_API = "http://localhost:3001/api/stock";
const JSON_HEADERS = { "Content-Type": "application/json" };

const DEFAULT_FORM = {
  label: "",
  show_on_open: true,
  show_on_close: true,
  sort_order: "0",
};

function getDefaultUnitStep(label: string) {
  return label.trim().toLowerCase() === "pan de molde" ? 0.5 : 1;
}

function VitrineStockTab() {
  const { items, loading, refetch } = useVitrineStockItems();
  const { menuItems } = useMenuItems();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VitrineStockItem | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<number[]>([]);
  const [quantityByMenuItemId, setQuantityByMenuItemId] = useState<Record<number, string>>({});
  const [menuSearchTerm, setMenuSearchTerm] = useState("");

  const activeItems = items.filter((item) => item.active);
  const mappedCount = items.filter((item) => (item.mappings?.length ?? 0) > 0).length;

  const filteredMenuItems = useMemo(() => {
    const active = menuItems.filter((item) => item.is_active);
    if (!menuSearchTerm.trim()) return active;
    const term = menuSearchTerm.toLowerCase();
    return active.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.category_name?.toLowerCase().includes(term),
    );
  }, [menuItems, menuSearchTerm]);

  function resetForm() {
    setEditingItem(null);
    setFormData(DEFAULT_FORM);
    setSelectedMenuItemIds([]);
    setQuantityByMenuItemId({});
    setMenuSearchTerm("");
  }

  function openCreateDialog() {
    resetForm();
    setIsFormOpen(true);
  }

  function openEditDialog(item: VitrineStockItem) {
    setEditingItem(item);
    setFormData({
      label: item.label,
      show_on_open: Boolean(item.show_on_open),
      show_on_close: Boolean(item.show_on_close),
      sort_order: String(item.sort_order),
    });
    setSelectedMenuItemIds((item.mappings ?? []).map((mapping) => mapping.menu_item_id));
    setQuantityByMenuItemId(
      Object.fromEntries(
        (item.mappings ?? []).map((mapping) => [
          mapping.menu_item_id,
          String(mapping.quantity_per_item ?? 1),
        ]),
      ),
    );
    setMenuSearchTerm("");
    setIsFormOpen(true);
  }

  function toggleMenuItem(menuItemId: number) {
    setSelectedMenuItemIds((prev) => {
      if (prev.includes(menuItemId)) {
        setQuantityByMenuItemId((quantities) => {
          const next = { ...quantities };
          delete next[menuItemId];
          return next;
        });
        return prev.filter((id) => id !== menuItemId);
      }

      setQuantityByMenuItemId((quantities) => ({
        ...quantities,
        [menuItemId]: quantities[menuItemId] ?? "1",
      }));
      return [...prev, menuItemId];
    });
  }

  function updateMenuItemQuantity(menuItemId: number, value: string) {
    setQuantityByMenuItemId((prev) => ({ ...prev, [menuItemId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingItem
        ? `${STOCK_API}/vitrine-items/${editingItem.id}`
        : `${STOCK_API}/vitrine-items`;
      const method = editingItem ? "PUT" : "POST";
      const body = {
        label: formData.label,
        unit_step: getDefaultUnitStep(formData.label),
        show_on_open: formData.show_on_open,
        show_on_close: formData.show_on_close,
        sort_order: Number(formData.sort_order) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Error al guardar item de vitrina");
        return;
      }

      const savedItem = editingItem ?? (await res.json());
      const itemId = editingItem ? editingItem.id : savedItem.id;

      await fetch(`${STOCK_API}/vitrine-items/${itemId}/mappings`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          mappings: selectedMenuItemIds.map((menuItemId) => ({
            menu_item_id: menuItemId,
            quantity_per_item: Number(quantityByMenuItemId[menuItemId]) || 1,
          })),
        }),
      });

      toast.success(editingItem ? "Item de vitrina actualizado" : "Item de vitrina creado");
      setIsFormOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("Error al guardar item de vitrina");
    }
  }

  async function handleToggleActive(item: VitrineStockItem) {
    try {
      const res = await fetch(`${STOCK_API}/vitrine-items/${item.id}/active`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ active: !item.active }),
      });
      if (!res.ok) {
        toast.error("Error al cambiar estado");
        return;
      }
      toast.success(item.active ? "Item desactivado" : "Item activado");
      refetch();
    } catch {
      toast.error("Error al cambiar estado");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-emerald-400">{activeItems.length}</p>
              </div>
              <IconBasket className="text-emerald-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mapeados</p>
                <p className="text-2xl font-bold text-sky-400">{mappedCount}/{items.length}</p>
              </div>
              <IconChefHat className="text-sky-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Stock de Vitrina</p>
              <p className="text-xs text-muted-foreground">Configura qué se cuenta al abrir/cerrar caja.</p>
            </div>
            <Button onClick={openCreateDialog} className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-black">
              <IconPlus size={16} /> Nuevo
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <IconBasket size={36} className="mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold">Todavía no hay items de vitrina</p>
            <p className="text-sm text-muted-foreground mb-4">
              Creá los productos horneados que querés controlar en apertura y cierre.
            </p>
            <Button onClick={openCreateDialog}>Crear primer item</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`transition-all ${
                item.active ? "border-[var(--card-border)]" : "opacity-60 border-dashed"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{item.label}</h3>
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Orden de aparición {item.sort_order}
                      {item.unit_step !== 1 && " · Permite medios"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <IconPencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleActive(item)}>
                      <IconPower size={16} className={item.active ? "text-red-400" : "text-emerald-400"} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="gap-1">
                    {item.show_on_open ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                    Apertura
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {item.show_on_close ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                    Cierre
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Descuentan de vitrina
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(item.mappings ?? []).length > 0 ? (
                      item.mappings?.map((mapping) => (
                        <Badge key={mapping.id} variant="secondary" className="text-[11px]">
                          {mapping.menu_item_name}
                          {(mapping.quantity_per_item ?? 1) !== 1 && (
                            <span className="ml-1 text-amber-300">
                              ×{mapping.quantity_per_item}
                            </span>
                          )}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-amber-400">
                        Sin productos de carta mapeados
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-[var(--card-background)] border-[var(--card-border)] text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar item de vitrina" : "Nuevo item de vitrina"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esto no toca el stock general: solo define qué se cuenta en caja y qué productos vendidos lo descuentan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Nombre visible</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: Medialunas"
                  className="bg-[#181c1f] border-[var(--card-border)]"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Orden de aparición</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: e.target.value }))}
                  className="bg-[#181c1f] border-[var(--card-border)]"
                />
                <p className="text-[11px] text-muted-foreground">
                  Número menor aparece primero. El conteo permite medios solo para Pan de Molde.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Checkbox
                  checked={formData.show_on_open}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_on_open: checked === true }))
                  }
                />
                Mostrar en apertura
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Checkbox
                  checked={formData.show_on_close}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, show_on_close: checked === true }))
                  }
                />
                Mostrar en cierre
              </label>
            </div>

            <div className="space-y-2 min-h-0">
              <Label>Productos de carta que descuentan este item</Label>
              <div className="relative">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={menuSearchTerm}
                  onChange={(e) => setMenuSearchTerm(e.target.value)}
                  placeholder="Buscar producto de carta..."
                  className="pl-9 bg-[#181c1f] border-[var(--card-border)]"
                />
              </div>
              <ScrollArea className="h-56 rounded-lg border border-[var(--card-border)] p-2">
                <div className="space-y-1">
                  {filteredMenuItems.map((menuItem) => {
                    const isSelected = selectedMenuItemIds.includes(menuItem.id);

                    return (
                      <div
                        key={menuItem.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/5"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMenuItem(menuItem.id)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleMenuItem(menuItem.id)}
                          className="text-sm text-left flex-1"
                        >
                          {menuItem.name}
                          {menuItem.category_name && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                              {menuItem.category_name}
                            </span>
                          )}
                        </button>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Resta</span>
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={quantityByMenuItemId[menuItem.id] ?? "1"}
                              onChange={(e) =>
                                updateMenuItemQuantity(menuItem.id, e.target.value)
                              }
                              className="h-7 w-16 bg-[#181c1f] border-[var(--card-border)] text-white text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.label.trim()}>
                {editingItem ? "Guardar cambios" : "Crear item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VitrineStockTab;
