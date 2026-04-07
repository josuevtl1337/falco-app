import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconPlus,
  IconChartBar,
  IconReportMoney,
  IconPackage,
} from "@tabler/icons-react";
import { RoutePaths } from "@/routes/paths";

const actions = [
  {
    label: "Nueva orden",
    icon: IconPlus,
    path: RoutePaths.createOrder,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    label: "Ver resumen",
    icon: IconChartBar,
    path: RoutePaths.resume,
    color: "text-blue-400",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    label: "Finanzas",
    icon: IconReportMoney,
    path: RoutePaths.finance,
    color: "text-purple-400",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    label: "Stock",
    icon: IconPackage,
    path: RoutePaths.stockControl,
    color: "text-amber-400",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((a) => (
        <Card
          key={a.label}
          onClick={() => navigate(a.path)}
          className={`cursor-pointer border-border/50 ${a.bg} transition-all duration-200 hover:scale-[1.02]`}
        >
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <a.icon size={22} className={a.color} />
            <span className="text-sm font-medium">{a.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
