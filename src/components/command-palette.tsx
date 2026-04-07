import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconFlask,
  IconReportMoney,
  IconCalculatorFilled,
  IconPackage,
  IconSearch,
} from "@tabler/icons-react";
import { RoutePaths } from "@/routes/paths";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  keywords: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Inicio",
    path: RoutePaths.root,
    icon: IconDashboard,
    keywords: "home dashboard panel inicio",
  },
  {
    label: "Resumen",
    path: RoutePaths.resume,
    icon: IconChartBar,
    keywords: "resumen summary report metricas ventas",
  },
  {
    label: "Salon — Nueva orden",
    path: RoutePaths.createOrder,
    icon: IconListDetails,
    keywords: "salon hall orden pedido mesa table pos caja",
  },
  {
    label: "Carta",
    path: RoutePaths.menu,
    icon: IconChartBar,
    keywords: "menu carta productos items precios",
  },
  {
    label: "Calibración",
    path: RoutePaths.calibration,
    icon: IconFlask,
    keywords: "calibracion cafe coffee espresso",
  },
  {
    label: "Finanzas",
    path: RoutePaths.finance,
    icon: IconReportMoney,
    keywords: "finanzas finance gastos expenses servicios",
  },
  {
    label: "Motor de Costos",
    path: RoutePaths.costEngine,
    icon: IconCalculatorFilled,
    keywords: "costos cost recetas recipes ingredientes proveedores",
  },
  {
    label: "Control de Stock",
    path: RoutePaths.stockControl,
    icon: IconPackage,
    keywords: "stock inventario inventory alertas",
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <div className="relative w-full max-w-lg mx-4 animate-in fade-in slide-in-from-top-4 duration-200">
        <Command
          className="rounded-xl border border-border/60 bg-popover shadow-2xl overflow-hidden"
          label="Navegación rápida"
        >
          <div className="flex items-center gap-2 border-b border-border/50 px-4">
            <IconSearch size={16} className="text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Buscar sección..."
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados.
            </Command.Empty>
            <Command.Group heading="Navegación" className="px-1">
              {NAV_ITEMS.map((item) => (
                <Command.Item
                  key={item.path}
                  value={`${item.label} ${item.keywords}`}
                  onSelect={() => handleSelect(item.path)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
                >
                  <item.icon size={18} className="text-muted-foreground shrink-0" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
