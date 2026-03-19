import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconLeaf,
} from "@tabler/icons-react";
import { IRawMaterial, ISupplier, UnitType } from "../types";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/cost-engine";

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RawMaterialsTab() {
  const [materials, setMaterials] = useState<IRawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<IRawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    supplier_id: "",
    purchase_price: "",
    purchase_quantity: "",
    purchase_unit: "gr" as UnitType,
  });

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE}/raw-materials`);
      setMaterials(await response.json());
    } catch {
      toast.error("Error al cargar materias primas");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE}/suppliers`);
      setSuppliers(await response.json());
    } catch {
      toast.error("Error al cargar proveedores");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMaterial
        ? `${API_BASE}/raw-materials/${editingMaterial.id}`
        : `${API_BASE}/raw-materials`;
      const response = await fetch(url, {
        method: editingMaterial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          supplier_id: parseInt(formData.supplier_id),
          purchase_price: parseFloat(formData.purchase_price),
          purchase_quantity: parseFloat(formData.purchase_quantity),
        }),
      });
      if (response.ok) {
        toast.success(editingMaterial ? "Materia prima actualizada" : "Materia prima creada");
        setIsDialogOpen(false);
        resetForm();
        fetchMaterials();
      } else {
        toast.error("Error al guardar materia prima");
      }
    } catch {
      toast.error("Error al guardar materia prima");
    }
  };

  function resetForm() {
    setEditingMaterial(null);
    setFormData({ name: "", supplier_id: "", purchase_price: "", purchase_quantity: "", purchase_unit: "gr" });
  }

  const handleEdit = (material: IRawMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      supplier_id: material.supplier_id?.toString() || "",
      purchase_price: material.purchase_price.toString(),
      purchase_quantity: material.purchase_quantity.toString(),
      purchase_unit: material.purchase_unit,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta materia prima?")) return;
    try {
      const response = await fetch(`${API_BASE}/raw-materials/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Materia prima eliminada");
        fetchMaterials();
      } else {
        toast.error("Error al eliminar materia prima");
      }
    } catch {
      toast.error("Error al eliminar materia prima");
    }
  };

  // Live unit cost preview
  const previewUnitCost = useMemo(() => {
    const price = parseFloat(formData.purchase_price);
    const qty = parseFloat(formData.purchase_quantity);
    if (!price || !qty || qty === 0) return null;
    return price / qty;
  }, [formData.purchase_price, formData.purchase_quantity]);

  const filtered = materials.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSupplier === "all" || m.supplier_id?.toString() === filterSupplier;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar materia prima..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterSupplier} onValueChange={setFilterSupplier}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los proveedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="gap-1.5"
        >
          <IconPlus size={16} />
          Agregar Materia Prima
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <IconLeaf size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron materias primas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((material) => (
            <Card
              key={material.id}
              className="border-border/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="pt-4 pb-3 px-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{material.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {material.supplier_name || "Sin proveedor"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {material.purchase_unit}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-emerald-400">
                      ${formatARS(material.unit_cost)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      por {material.purchase_unit}
                    </p>
                  </div>
                </div>

                {/* Purchase info */}
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30 text-xs">
                  <span className="text-muted-foreground">Compra</span>
                  <span>
                    ${formatARS(material.purchase_price)} × {material.purchase_quantity} {material.purchase_unit}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(material)}
                  >
                    <IconPencil size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(material.id)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Materia Prima" : "Nueva Materia Prima"}</DialogTitle>
            <DialogDescription>
              {editingMaterial ? "Modifica la información de la materia prima" : "Agrega una nueva materia prima al sistema"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="supplier_id">Proveedor *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_price">Precio de Compra *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_quantity">Cantidad *</Label>
                <Input
                  id="purchase_quantity"
                  type="number"
                  step="0.01"
                  value={formData.purchase_quantity}
                  onChange={(e) => setFormData({ ...formData, purchase_quantity: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="purchase_unit">Unidad de Compra *</Label>
              <Select
                value={formData.purchase_unit}
                onValueChange={(value) => setFormData({ ...formData, purchase_unit: value as UnitType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="gr">Gramos (gr)</SelectItem>
                  <SelectItem value="l">Litros (l)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="unidad">Unidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live cost preview */}
            {previewUnitCost !== null && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">Costo unitario calculado</p>
                <p className="text-lg font-bold text-emerald-400">
                  ${formatARS(previewUnitCost)} / {formData.purchase_unit}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RawMaterialsTab;
