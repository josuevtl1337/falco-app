// imports
import { z } from "zod"; // ✅ zod sin default
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
// import { Link } from "react-router-dom"; // (no se usa, podés quitarlo)
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChartNoAxesColumn,
  Gauge,
  Minus,
  Save,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { formatRatio } from "../utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ICoffeesRes {
  id: number;
  name: string;
  benefit: string;
  origin?: string;
}
const METHODS = [
  { value: "espresso", label: "Espresso" },
  { value: "filter", label: "Filtrado" },
] as const;

// --- schema ---
const FormSchema = z.object({
  coffee_id: z.string({ message: "Selecciona un cafe" }),
  benefit: z.enum(["washed", "natural", "honey"]),
  method: z.enum(["espresso", "filter"]),
  dry: z.number().min(1, { message: "Ingresá el peso seco" }).optional(),
  wet: z.number().min(1, { message: "Ingresá el peso liquido" }),
  time: z.number().min(1, { message: "Ingresá el tiempo de extraccion" }),
  notes: z.string().min(0, { message: "Ingresa una nota final" }).optional(),
  fav: z.boolean().optional(),
  evaluation: z.object({
    saturation: z.number().min(1).max(3),
    balance: z.number().min(1).max(3),
    texture: z.number().min(1).max(3),
    finish: z.number().min(1).max(3),
  }),
});

type FormValues = z.infer<typeof FormSchema>;

function CalibrationTab() {
  const [coffees, setCoffes] = useState<ICoffeesRes[]>();

  useEffect(() => {
    fetchCoffees();
  }, []);

  const fetchCoffees = () => {
    fetch("http://localhost:3001/api/calibration/get-coffees")
      .then((res) => res.json())
      .then((data) => {
        console.log("data ejejej", data);
        setCoffes(data);
      });
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      coffee_id: "",
      benefit: "washed",
      method: "espresso",
      dry: 0,
      wet: 0,
      time: 0,
      notes: "",
      fav: false,
      evaluation: { saturation: 2, balance: 2, texture: 2, finish: 2 },
    },
  });

  const EVAL_FIELDS: { key: keyof FormValues["evaluation"]; label: string }[] =
    [
      { key: "saturation", label: "Saturación" },
      { key: "balance", label: "Balance" },
      { key: "texture", label: "Textura" },
      { key: "finish", label: "Final" },
    ];

  function onSubmit(data: FormValues) {
    console.log("Form Data:", data);

    const coffeeId = Number(data.coffee_id);

    const payload = {
      coffee_id: coffeeId,
      method: data.method,
      dose_g: Number(data.dry ?? 0),
      yield_g: Number(data.wet ?? 0),
      extraction_time_s: Number(data.time ?? 0),
      ratio_label: ratioLabel as string,
      final_opinion: data.notes?.trim() || null,
      fav: !!data.fav,
      evaluation: data.evaluation,
    };

    fetch("http://localhost:3001/api/calibration/add-tasting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(() => {
        toast.success("Se ha registrado la nueva cata :)");
        form.reset();
      })
      .catch((error) => {
        toast.error("Algo a salido mal intentalo mas tarde");
        console.error("Error adding product:", error);
      });
  }

  const [dry, wet, method, time, evaluation] = useWatch({
    control: form.control,
    name: ["dry", "wet", "method", "time", "evaluation"],
  });

  const ratio = Number(dry) > 0 ? Number(wet) / Number(dry) : 0;
  const decimals = method === "espresso" ? 2 : 0;
  const ratioLabel = Number(dry) > 0 ? formatRatio(ratio, decimals) : 0;

  function hint(): string {
    if (time) {
      if (time < 22 && ratio > 2.2)
        return "Resultado rápido y diluido: molé más fino o baja el yield.";
      if (time > 32 && ratio < 1.8)
        return "Extracción lenta y concentrada: molé más grueso o subí el yield.";
      if (evaluation.saturation <= 2 && evaluation.finish <= 2)
        return "Saturación baja y final corto: probá subir tiempo o bajar el ratio (~1:1.8).";
      return "Se ve balanceado. Podés afinar por textura o aromas.";
    } else {
      return "";
    }
  }

  return (
    <Card className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="grid grid-cols-2 w-full p-4 gap-4">
            {/* Origen */}
            <FormField
              control={form.control}
              name="coffee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Varietal</FormLabel>
                  <Select
                    required
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná el origen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coffees &&
                        coffees.length > 0 &&
                        coffees.map((o) => (
                          <SelectItem key={o.name} value={o.id.toString()}>
                            {`${o.name} — ${o.benefit} ${
                              o.origin ? `— ${o.origin}` : ""
                            } `}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Método */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="grid grid-cols-3 gap-x-4">
            <Card className="w-full p-6 col-span-2">
              <div className="flex flex-col">
                <h1 className="flex flex-row-center gap-2">
                  <Gauge />
                  Extraccion
                </h1>
                <p className="text-sm">Ingresa los datos de la cata</p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {/* Seco (g) */}
                <FormField
                  control={form.control}
                  name="dry"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Dosis Seca (g)</FormLabel>
                      <FormControl className="w-full">
                        <Input
                          {...field}
                          type="number"
                          placeholder="Ej: 18"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : +e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Liquido */}
                <FormField
                  control={form.control}
                  name="wet"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Dosis liquida / Yield (g)</FormLabel>
                      <FormControl className="w-full">
                        <Input
                          {...field}
                          type="number"
                          placeholder="Ej: 36"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : +e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Tiempo */}
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Tiempo de Extraccion (s)</FormLabel>
                      <FormControl className="w-full">
                        <Input
                          {...field}
                          type="number"
                          placeholder="Ej: 30"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : +e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage>{hint()}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Ratio */}
                <div className="flex flex-col gap-2">
                  <Label>Brew Ratio</Label>
                  <div className="bg-white rounded-4xl w-45 flex justify-start h-8 col-span-1">
                    <p className=" m-auto text-center font-bold text-black">
                      {ratioLabel}
                    </p>
                  </div>
                </div>

                {/* Opinion */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Opinion final</FormLabel>
                      <FormControl className="w-full">
                        <Textarea
                          required={false}
                          {...field}
                          value={field.value ?? ""} // evita uncontrolled
                          id="notes"
                          placeholder="Aroma, acidez, dulzor, defectos, etc."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="col-span-2"></div>

                {/* Fav */}
                <FormField
                  control={form.control}
                  name="fav"
                  render={({ field }) => (
                    <FormItem className="col-span-1 gap-2 pt-2">
                      <FormLabel>Favorito</FormLabel>
                      <FormControl>
                        <Checkbox
                          id="fav"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Eval */}
            <Card className="p-6">
              <div className="flex flex-col gap-2">
                <h1 className="flex flex-row gap-2">
                  <ChartNoAxesColumn />
                  Evaluacion
                </h1>
                <p className="text-sm">Califica con ↑ ✓ ↓</p>
              </div>

              {EVAL_FIELDS.map(({ key, label }) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`evaluation.${key}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between text-sm">
                        <FormLabel>{label}</FormLabel>
                        <span className="font-medium">{field.value}</span>
                      </div>

                      <FormControl>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <ArrowDown className="text-red-800" />
                            <Minus />
                            <ArrowUp className="text-green-800" />
                          </div>
                          <Slider
                            value={[field.value ?? 2]}
                            onValueChange={(v) => field.onChange(v[0])}
                            onValueCommit={(v) => field.onChange(v[0])}
                            min={1}
                            max={3}
                            step={1}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </Card>
          </div>
          <Button type="submit">
            <Save /> Guardar cata
          </Button>
        </form>
      </Form>
    </Card>
  );
}

export default CalibrationTab;
