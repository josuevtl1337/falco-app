import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { API_BASE } from "@/lib/api";

const BENEFITS = [
  { value: "washed", label: "Lavado" },
  { value: "natural", label: "Natural" },
  { value: "honey", label: "Honey" },
] as const;

function AddCoffeeTab() {
  const FormSchema = z.object({
    name: z.string().min(2).max(50),
    benefit: z.string().min(2).max(50),
    origin: z.string().optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      benefit: "",
      origin: "",
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    fetch(`${API_BASE}/calibration/add-coffee`, {
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
      .then(() => {
        toast.success("Se ha registrado el nuevo café :)");
        form.reset();
      })
      .catch((error) => {
        toast.error("Error al agregar el cafe.");
        console.error("Error adding coffee:", error);
      });
  };

  return (
    <main>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => onSubmit(data))}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
        >
          <FormField
            key={`name`}
            control={form.control}
            name={`name`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {"Nombre de etiqueta"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={"text"}
                    placeholder={`Santa cruz / Aventura / Pingorcho`}
                    required
                    onChange={(e) => {
                      formField.onChange(e.target.value);
                    }}
                    className=""
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {`Nombre de la etiqueta del paquete`}
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
          {/* Beneficio */}
          <FormField
            control={form.control}
            name="benefit"
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="font-semibold">{"Beneficio"}</FormLabel>
                <Select
                  value={formField.value}
                  onValueChange={formField.onChange}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná beneficio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BENEFITS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {`Selecciona el beneficio del lote`}
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key={`origin`}
            control={form.control}
            name={`origin`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="font-semibold">{"Origen"}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={"text"}
                    placeholder={`Peru - Nicaragua - Brasil - Colombia`}
                    onChange={(e) => {
                      formField.onChange(e.target.value);
                    }}
                    className=""
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {`Pais de origen`}
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2 flex justify-center mt-4">
            <Button type="submit" className="">
              Guardar
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}

export default AddCoffeeTab;
