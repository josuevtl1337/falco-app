import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconTruck,
  IconPhone,
} from "@tabler/icons-react";
import { ISupplier } from "../types";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/cost-engine";

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", contact_info: "" });

  useEffect(() => {
    fetchSuppliers();
  }, []);

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
      const url = editingSupplier
        ? `${API_BASE}/suppliers/${editingSupplier.id}`
        : `${API_BASE}/suppliers`;
      const response = await fetch(url, {
        method: editingSupplier ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success(editingSupplier ? "Proveedor actualizado" : "Proveedor creado");
        setIsDialogOpen(false);
        setEditingSupplier(null);
        setFormData({ name: "", contact_info: "" });
        fetchSuppliers();
      } else {
        toast.error("Error al guardar proveedor");
      }
    } catch {
      toast.error("Error al guardar proveedor");
    }
  };

  const handleEdit = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setFormData({ name: supplier.name, contact_info: supplier.contact_info || "" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este proveedor?")) return;
    try {
      const response = await fetch(`${API_BASE}/suppliers/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Proveedor eliminado");
        fetchSuppliers();
      } else {
        toast.error("Error al eliminar proveedor");
      }
    } catch {
      toast.error("Error al eliminar proveedor");
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditingSupplier(null);
            setFormData({ name: "", contact_info: "" });
            setIsDialogOpen(true);
          }}
          className="gap-1.5"
        >
          <IconPlus size={16} />
          Agregar Proveedor
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <IconTruck size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron proveedores</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((supplier) => (
            <Card
              key={supplier.id}
              className="border-border/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="pt-4 pb-3 px-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                      <IconTruck size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{supplier.name}</h3>
                      {supplier.contact_info && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <IconPhone size={11} className="text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {supplier.contact_info}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(supplier)}
                  >
                    <IconPencil size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(supplier.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? "Modifica la información del proveedor" : "Agrega un nuevo proveedor al sistema"}
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
              <Label htmlFor="contact_info">Información de Contacto</Label>
              <Textarea
                id="contact_info"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>
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

export default SuppliersTab;
