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
  DialogTrigger,
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { IRawMaterial, ISupplier, UnitType } from "../types";
import { toast } from "sonner";
import { SearchAndFilter } from "./search-and-filter";
import { API_BASE } from "@/lib/api";

const API_BASE_CE = `${API_BASE}/cost-engine`;

function RawMaterialsTab() {
  const [materials, setMaterials] = useState<IRawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<IRawMaterial | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
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
      const response = await fetch(`${API_BASE_CE}/raw-materials`);
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      toast.error("Error al cargar materias primas");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE_CE}/suppliers`);
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMaterial
        ? `${API_BASE_CE}/raw-materials/${editingMaterial.id}`
        : `${API_BASE_CE}/raw-materials`;
      const method = editingMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          supplier_id: parseInt(formData.supplier_id),
          purchase_price: parseFloat(formData.purchase_price),
          purchase_quantity: parseFloat(formData.purchase_quantity),
        }),
      });

      if (response.ok) {
        toast.success(
          editingMaterial ? "Materia prima actualizada" : "Materia prima creada"
        );
        setIsDialogOpen(false);
        setEditingMaterial(null);
        setFormData({
          name: "",
          supplier_id: "",
          purchase_price: "",
          purchase_quantity: "",
          purchase_unit: "gr",
        });
        fetchMaterials();
      } else {
        toast.error("Error al guardar materia prima");
      }
    } catch (error) {
      toast.error("Error al guardar materia prima");
    }
  };

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
    if (!window.confirm("¿Estás seguro de eliminar esta materia prima?"))
      return;

    try {
      const response = await fetch(`${API_BASE_CE}/raw-materials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Materia prima eliminada");
        fetchMaterials();
      } else {
        toast.error("Error al eliminar materia prima");
      }
    } catch (error) {
      toast.error("Error al eliminar materia prima");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Materias Primas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingMaterial(null);
                setFormData({
                  name: "",
                  supplier_id: "",
                  purchase_price: "",
                  purchase_quantity: "",
                  purchase_unit: "gr",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Materia Prima
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial
                  ? "Editar Materia Prima"
                  : "Nueva Materia Prima"}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? "Modifica la información de la materia prima"
                  : "Agrega una nueva materia prima al sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier_id">Proveedor *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers &&
                      suppliers.length > 0 &&
                      suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.id.toString()}
                        >
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_price: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_quantity: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="purchase_unit">Unidad de Compra *</Label>
                <Select
                  value={formData.purchase_unit}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      purchase_unit: value as UnitType,
                    })
                  }
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={filterSupplier}
        onFilterChange={setFilterSupplier}
        filterOptions={suppliers.map((s) => ({
          value: s.id.toString(),
          label: s.name,
        }))}
        filterPlaceholder="Filtrar por proveedor"
        searchPlaceholder="Buscar materia prima..."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Precio Compra</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Costo Unitario</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const filtered = materials.filter((material) => {
              const matchesSearch = material.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
              const matchesFilter =
                filterSupplier === "all" ||
                (material.supplier_id !== null &&
                  material.supplier_id !== undefined &&
                  material.supplier_id.toString() === filterSupplier);
              return matchesSearch && matchesFilter;
            });

            if (filtered.length === 0) {
              return (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron materias primas
                  </TableCell>
                </TableRow>
              );
            }

            return filtered.map((material) => (
              <TableRow key={material.id}>
                <TableCell>{material.id}</TableCell>
                <TableCell>{material.name}</TableCell>
                <TableCell>{material.supplier_name || "-"}</TableCell>
                <TableCell>
                  ${material.purchase_price.toLocaleString()}
                </TableCell>
                <TableCell>{material.purchase_quantity}</TableCell>
                <TableCell>{material.purchase_unit}</TableCell>
                <TableCell>
                  ${material.unit_cost.toFixed(2)} / {material.purchase_unit}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ));
          })()}
        </TableBody>
      </Table>
    </div>
  );
}

export default RawMaterialsTab;
