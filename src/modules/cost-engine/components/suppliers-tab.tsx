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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ISupplier } from "../types";
import { toast } from "sonner";
import { SearchAndFilter } from "./search-and-filter";

const API_BASE = "http://localhost:3001/api/cost-engine";

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", contact_info: "" });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE}/suppliers`);
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSupplier
        ? `${API_BASE}/suppliers/${editingSupplier.id}`
        : `${API_BASE}/suppliers`;
      const method = editingSupplier ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingSupplier ? "Proveedor actualizado" : "Proveedor creado"
        );
        setIsDialogOpen(false);
        setEditingSupplier(null);
        setFormData({ name: "", contact_info: "" });
        fetchSuppliers();
      } else {
        toast.error("Error al guardar proveedor");
      }
    } catch (error) {
      toast.error("Error al guardar proveedor");
    }
  };

  const handleEdit = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_info: supplier.contact_info || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este proveedor?")) return;

    try {
      const response = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Proveedor eliminado");
        fetchSuppliers();
      } else {
        toast.error("Error al eliminar proveedor");
      }
    } catch (error) {
      toast.error("Error al eliminar proveedor");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Proveedores</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSupplier(null);
                setFormData({ name: "", contact_info: "" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier
                  ? "Modifica la información del proveedor"
                  : "Agrega un nuevo proveedor al sistema"}
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
                <Label htmlFor="contact_info">Información de Contacto</Label>
                <Textarea
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_info: e.target.value })
                  }
                />
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
        showFilter={false}
        searchPlaceholder="Buscar proveedor..."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            const filtered = suppliers.filter((supplier) =>
              supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filtered.length === 0) {
              return (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron proveedores
                  </TableCell>
                </TableRow>
              );
            }

            return filtered.map((supplier: ISupplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.id}</TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact_info || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
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

export default SuppliersTab;
