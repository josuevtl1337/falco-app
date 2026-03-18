import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFlame } from "@tabler/icons-react";

interface TopProduct {
  menu_item_id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
}

interface TopProductsCardProps {
  products: TopProduct[];
}

function formatARS(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function TopProductsCard({ products }: TopProductsCardProps) {
  if (products.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sin datos de productos este mes
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxQty = products[0]?.quantity_sold || 1;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <IconFlame size={16} className="text-orange-400" />
          Productos más vendidos del mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((p, i) => (
          <div key={p.menu_item_id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-4">
                  {i + 1}
                </span>
                <span className="text-sm font-medium truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {p.quantity_sold} uds
                </span>
                <span className="text-xs font-medium text-emerald-400">
                  ${formatARS(p.revenue)}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
                style={{ width: `${(p.quantity_sold / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
