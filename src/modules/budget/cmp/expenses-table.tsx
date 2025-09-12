import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IExpense {
  id: number;
  name: string;
  description: string;
  units: number;
  amount: number;
  currency: string; // 'USD', 'ARS', etc.
  payment_type: string; // 'cash', 'credit_card', etc.
  document: string; // 'invoice', 'receipt', etc.
  date: string; // ISO date string
  created_at: string; // ISO date string
}

interface Props {
  expensesList: IExpense[];
}

function ExpensesTable(props: Props) {
  const { expensesList } = props;

  type Column = {
    key: keyof IExpense;
    label: string;
    className?: string;
    format?: (value: any) => React.ReactNode;
  };

  const columns: Column[] = [
    { key: "id", label: "ID", className: "w-[100px]" },
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción", className: "w-[200px]" },
    { key: "units", label: "Unidades" },
    {
      key: "amount",
      label: "Monto",
      format: (v: number) => `$${v.toLocaleString()}`,
    },
    { key: "currency", label: "Moneda" },
    { key: "payment_type", label: "Tipo de Pago" },
    { key: "document", label: "Documento" },
    {
      key: "date",
      label: "Fecha de Pago",
      format: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      key: "created_at",
      label: "Fecha Creación",
      format: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  return (
    <Table>
      {/* <TableCaption>Lista de gastos.</TableCaption> */}
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
        {expensesList.map((expense) => (
          <TableRow key={expense.id}>
            {columns.map((col) => (
              <TableCell key={col.key} className={col.className}>
                {col.format
                  ? col.format(expense[col.key as keyof IExpense])
                  : expense[col.key as keyof IExpense] ?? "-"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default ExpensesTable;
