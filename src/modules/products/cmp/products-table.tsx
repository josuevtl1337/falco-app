import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IProduct } from "../types";

interface Props {
  productsList: IProduct[];
}

function ProductsTable(props: Props) {
  const { productsList } = props;

  type Column = {
    key: keyof IProduct;
    label: string;
    className?: string;
    format?: (value: any) => React.ReactNode;
  };

  const columns: Column[] = [
    { key: "id", label: "ID", className: "w-[100px]" },
    { key: "name", label: "Nombre" },
    { key: "category_id", label: "Categoria" },
    {
      key: "supplier_price",
      label: "Precio Proveedor",
      format: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      key: "sale_price",
      label: "Precio Final",
      format: (v: number) => `$${v.toLocaleString()}`,
    },
    { key: "stock_quantity", label: "Stock" },
    { key: "unit", label: "Unidad" },
    {
      key: "created_at",
      label: "Fecha Creación",
      format: (v: string) => new Date(v).toLocaleDateString(),
    },
    { key: "supplier_id", label: "ID Proveedor" },
  ];

  return (
    <Table>
      <TableCaption>Lista de productos.</TableCaption>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={col.className}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {productsList.map((product) => (
          <TableRow key={product.id}>
            {columns.map((col) => (
              <TableCell key={col.key} className={col.className}>
                {col.format
                  ? col.format(product[col.key as keyof IProduct])
                  : product[col.key as keyof IProduct] ?? "-"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default ProductsTable;
