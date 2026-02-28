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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { IFixedCost, ICostProduct } from "../types";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";

const API_BASE_CE = `${API_BASE}/cost-engine`;

function FixedCostsTab() {
  const [fixedCosts, setFixedCosts] = useState<IFixedCost[]>([]);
  const [products, setProducts] = useState<ICostProduct[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<IFixedCost | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost_per_item: "",
    cost_per_minute: "",
    is_global: false,
    product_id: "",
  });

  useEffect(() => {
    fetchFixedCosts();
    fetchProducts();
  }, []);

  const fetchFixedCosts = async () => {
    try {
      const response = await fetch(`${API_BASE_CE}/fixed-costs`);
      const data = await response.json();
      setFixedCosts(data);
    } catch (error) {
      toast.error("Error al cargar gastos fijos");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_CE}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFixedCost
        ? `${API_BASE_CE}/fixed-costs/${editingFixedCost.id}`
        : `${API_BASE_CE}/fixed-costs`;
      const method = editingFixedCost ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          cost_per_item: parseFloat(formData.cost_per_item) || 0,
          cost_per_minute: parseFloat(formData.cost_per_minute) || 0,
          is_global: formData.is_global ? 1 : 0,
          product_id: formData.is_global
            ? null
            : formData.product_id
            ? parseInt(formData.product_id)
            : null,
        }),
      });

      if (response.ok) {
        toast.success(
          editingFixedCost ? "Gasto fijo actualizado" : "Gasto fijo creado"
        );
        setIsDialogOpen(false);
        setEditingFixedCost(null);
        setFormData({
          name: "",
          description: "",
          cost_per_item: "",
          cost_per_minute: "",
          is_global: false,
          product_id: "",
        });
        fetchFixedCosts();
      } else {
        toast.error("Error al guardar gasto fijo");
      }
    } catch (error) {
      toast.error("Error al guardar gasto fijo");
    }
  };

  const handleEdit = (fixedCost: IFixedCost) => {
    setEditingFixedCost(fixedCost);
    setFormData({
      name: fixedCost.name,
      description: fixedCost.description || "",
      cost_per_item: fixedCost.cost_per_item.toString(),
      cost_per_minute: fixedCost.cost_per_minute.toString(),
      is_global: fixedCost.is_global === 1,
      product_id: fixedCost.product_id?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto fijo?")) return;

    try {
      const response = await fetch(`${API_BASE_CE}/fixed-costs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Gasto fijo eliminado");
        fetchFixedCosts();
      } else {
        toast.error("Error al eliminar gasto fijo");
      }
    } catch (error) {
      toast.error("Error al eliminar gasto fijo");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gastos Fijos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingFixedCost(null);
                setFormData({
                  name: "",
                  description: "",
                  cost_per_item: "",
                  cost_per_minute: "",
                  is_global: false,
                  product_id: "",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Gasto Fijo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFixedCost
                  ? "Editar Gasto Fijo"
                  : "Nuevo Gasto Fijo"}
              </DialogTitle>
              <DialogDescription>
                {editingFixedCost
                  ? "Modifica la información del gasto fijo"
                  : "Define un gasto fijo global o por producto"}
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
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_global}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_global: checked })
                  }
                />
                <Label htmlFor="is_global">Gasto fijo global</Label>
              </div>
              {!formData.is_global && (
                <div>
                  <Label htmlFor="product_id">Producto</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, product_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_per_item">Costo por Ítem</Label>
                  <Input
                    id="cost_per_item"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_item}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_per_item: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cost_per_minute">Costo por Minuto</Label>
                  <Input
                    id="cost_per_minute"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_minute}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_per_minute: e.target.value,
                      })
                    }
                  />
                </div>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Costo/Ítem</TableHead>
            <TableHead>Costo/Minuto</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fixedCosts.map((fixedCost) => (
            <TableRow key={fixedCost.id}>
              <TableCell>{fixedCost.id}</TableCell>
              <TableCell>{fixedCost.name}</TableCell>
              <TableCell>
                {fixedCost.is_global ? (
                  <span className="text-blue-600">Global</span>
                ) : (
                  <span className="text-gray-600">Por Producto</span>
                )}
              </TableCell>
              <TableCell>{fixedCost.product_name || "-"}</TableCell>
              <TableCell>${fixedCost.cost_per_item.toFixed(2)}</TableCell>
              <TableCell>${fixedCost.cost_per_minute.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(fixedCost)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fixedCost.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default FixedCostsTab;
