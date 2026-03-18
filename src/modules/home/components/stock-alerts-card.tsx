import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconArrowRight } from "@tabler/icons-react";
import { RoutePaths } from "@/routes/paths";

interface StockAlert {
  id: number;
  name: string;
  current_stock: number;
  alert_threshold: number;
}

interface StockAlertsCardProps {
  alerts: StockAlert[];
}

export default function StockAlertsCard({ alerts }: StockAlertsCardProps) {
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sin alertas de stock
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconAlertTriangle size={16} className="text-amber-400" />
            Alertas de Stock
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {alerts.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => navigate(RoutePaths.stockControl)}
          >
            Ver todo <IconArrowRight size={14} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 4).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
          >
            <span className="text-sm font-medium truncate mr-2">
              {alert.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-red-400 font-bold">
                {alert.current_stock}
              </span>
              <span className="text-xs text-muted-foreground">
                / {alert.alert_threshold}
              </span>
            </div>
          </div>
        ))}
        {alerts.length > 4 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{alerts.length - 4} más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
