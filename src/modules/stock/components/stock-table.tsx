import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconPlus, IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";
import type { StockItem } from "../index";

interface StockTableProps {
  items: StockItem[];
  loading: boolean;
  onAddStock: (item: StockItem) => void;
  onUpdateStock: (id: number, stockQuantity: number, minStock: number) => void;
}

function StockTable({
  items,
  loading,
  onAddStock,
  onUpdateStock,
}: StockTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    stock_quantity: number;
    min_stock: number;
  }>({ stock_quantity: 0, min_stock: 0 });

  const startEditing = (item: StockItem) => {
    setEditingId(item.id);
    setEditValues({
      stock_quantity: item.stock_quantity,
      min_stock: item.min_stock,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ stock_quantity: 0, min_stock: 0 });
  };

  const saveEditing = (id: number) => {
    onUpdateStock(id, editValues.stock_quantity, editValues.min_stock);
    setEditingId(null);
  };

  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      kg: "kg",
      gr: "g",
      l: "L",
      ml: "ml",
      unidad: "u",
    };
    return labels[unit] || unit;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay insumos registrados
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Insumo</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Stock Actual</TableHead>
            <TableHead className="text-right">Stock Mínimo</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={
                item.status === "low"
                  ? "bg-red-50 dark:bg-red-950/30"
                  : undefined
              }
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.supplier_name || "-"}
              </TableCell>
              <TableCell className="text-right">
                {editingId === item.id ? (
                  <Input
                    type="number"
                    value={editValues.stock_quantity}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        stock_quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 text-right ml-auto"
                  />
                ) : (
                  <span
                    className={
                      item.status === "low"
                        ? "text-red-600 font-semibold"
                        : undefined
                    }
                  >
                    {item.stock_quantity.toLocaleString("es-AR")}{" "}
                    {getUnitLabel(item.purchase_unit)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingId === item.id ? (
                  <Input
                    type="number"
                    value={editValues.min_stock}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        min_stock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 text-right ml-auto"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {item.min_stock.toLocaleString("es-AR")}{" "}
                    {getUnitLabel(item.purchase_unit)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.status === "low" ? (
                  <Badge variant="destructive">Bajo Stock</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Normal
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {editingId === item.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => saveEditing(item.id)}
                      >
                        <IconDeviceFloppy size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAddStock(item)}
                      >
                        <IconPlus size={16} />
                        <span className="ml-1">Agregar</span>
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default StockTable;
