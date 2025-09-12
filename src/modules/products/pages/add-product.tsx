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
import { IProductFormField } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {}

function AddProduct(props: Props) {
  const {} = props;

  const FormSchema = z.object({
    name: z.string().min(2).max(50),
    category_id: z.string().min(2).max(50),
    supplier_price: z.number(),
    sale_price: z.number().min(0),
    stock_quantity: z.number().min(0),
    unit: z.number().min(0),
    supplier_id: z.string().min(2).max(50),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      category_id: "",
      supplier_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      unit: 0,
      supplier_id: "",
    },
  });

  // name, category_id, supplier_price, sale_price, stock_quantity, unit,supplier_id
  const ProductFormFields: IProductFormField[] = [
    {
      label: "Nombre",
      name: "name",
      type: "text",
      placeholder: "Nombre del producto",
      required: true,
      description: "Ingresa el nombre del producto.",
    },
    {
      label: "Categoria",
      name: "category_id",
      type: "text",
      placeholder: "Categoria del producto",
      required: true,
      description: "Ingresa la categoria del producto.",
    },
    {
      label: "Precio de compra",
      name: "supplier_price",
      type: "number",
      placeholder: "Precio de compra",
      required: true,
      description: "Ingresa el precio de compra del producto.",
    },
    {
      label: "Precio final",
      name: "sale_price",
      type: "number",
      placeholder: "Precio final",
      required: true,
      description: "Ingresa el precio final del producto.",
    },
    {
      label: "Unidad",
      name: "unit",
      type: "number",
      placeholder: "Unidad",
      required: true,
      description: "Ingresa la unidad del producto.",
    },
    {
      label: "Stock",
      name: "stock_quantity",
      type: "number",
      placeholder: "Stock",
      required: true,
      description: "Ingresa el stock del producto.",
    },
    {
      label: "Proveedor",
      name: "supplier_id",
      type: "text",
      placeholder: "Proveedor",
      required: true,
      description: "Ingresa el proveedor del producto.",
    },
  ];

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    fetch("http://localhost:3001/api/products/add-product", {
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
      .then((newProduct) => {
        console.log("Product added successfully:", newProduct);
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
          Agregar Producto
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSubmit(data))}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
          >
            {ProductFormFields.map((field: IProductFormField) => (
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

export default AddProduct;
