import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IExpenseFormField } from "../types/types";

interface Props {}

function AddExpense(props: Props) {
  const {} = props;

  const FormSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
    units: z.number().min(0),
    amount: z.number().min(0),
    currency: z.string().min(3).max(3), // Assuming currency is a 3-letter code
    payment_type: z.string().min(2).max(50),
    document: z.string().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
      units: 0,
      amount: 0,
      currency: "ARS", // Default currency
      payment_type: "",
      document: "",
      date: new Date().toISOString().split("T")[0], // Default to today
    },
  });

  // name, category_id, supplier_price, sale_price, stock_quantity, unit,supplier_id
  const ExpenseFormFields: IExpenseFormField[] = [
    {
      label: "Nombre",
      name: "name",
      type: "text",
      placeholder: "Nombre del gasto",
      required: true,
      description: "Ingresa el nombre del gasto.",
    },
    {
      label: "Descripción",
      name: "description",
      type: "text",
      placeholder: "Descripción del gasto (opcional)",
      required: false,
    },
    {
      label: "Unidades",
      name: "units",
      type: "number",
      placeholder: "Cantidad de unidades",
      required: true,
    },
    {
      label: "Monto",
      name: "amount",
      type: "number",
      placeholder: "Monto total del gasto",
      required: true,
    },
    {
      label: "Moneda",
      name: "currency",
      type: "text",
      placeholder: "Moneda (ej. USD, ARS)",
      required: true,
    },
    {
      label: "Tipo de Pago",
      name: "payment_type",
      type: "text",
      placeholder: "Tipo de pago (ej. efectivo, tarjeta)",
      required: true,
    },
    {
      label: "Documento",
      name: "document",
      type: "file",
      placeholder: "Documento asociado (ej. factura, recibo)",
      required: false,
    },
    {
      label: "Fecha de Pago",
      name: "date",
      type: "date",
      placeholder: "",
      required: true,
    },
  ];

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log("Form Data:", data);

    fetch("http://localhost:3001/api/expenses/add-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((newExpense) => {
        console.log("Product added successfully:", newExpense);
        form.reset();
      })
      .catch((error) => {
        console.error("Error adding product:", error);
      });
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-10 w-full max-w-3xl">
        <h2 className="text-3xl font-bold mb-8 text-center text-[color:var(--primary)]">
          Agregar Gasto
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSubmit(data))}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
          >
            {ExpenseFormFields.map((field: IExpenseFormField) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name as any}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700 dark:text-gray-200">
                      {field.label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...formField}
                        type={field.type}
                        placeholder={field.placeholder}
                        required={field.required}
                        onChange={(e) => {
                          if (field.type === "number") {
                            formField.onChange(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            );
                          } else {
                            formField.onChange(e.target.value);
                          }
                        }}
                        className="bg-blue-50 dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-400 dark:focus:ring-blue-600 focus:border-blue-400 dark:focus:border-blue-600 transition"
                      />
                    </FormControl>
                    {field.description && (
                      <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                        {field.description}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="md:col-span-2 flex justify-center mt-4">
              <Button type="submit" className="">
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

export default AddExpense;
