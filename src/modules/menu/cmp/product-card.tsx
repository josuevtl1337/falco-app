import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatARS } from "@/modules/commons/utils/helpers";
import { getCategoryStyle } from "@/modules/commons/constants/category-styles";
import { IMenuItem } from "backend/models/MenuModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ProductCard({
  product,
  onSelect,
  onEdit,
  onDelete,
}: {
  product: IMenuItem;
  onSelect?: (p: IMenuItem) => void;
  onEdit?: (p: IMenuItem) => void;
  onDelete?: (p: IMenuItem) => void;
}) {
  const style = getCategoryStyle(product.category_name ?? undefined);
  const isInactive = product.is_active === 0;

  return (
    <Card
      role={onSelect ? "button" : undefined}
      onClick={() => onSelect?.(product)}
      className={cn(
        "relative flex flex-col justify-between rounded-2xl border border-[var(--card-border)] p-4 shadow-lg transition-all",
        "bg-[var(--card-background)]",
        onSelect &&
          "cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:border-[var(--primary)] active:scale-[0.98]",
        isInactive && "opacity-50 grayscale"
      )}
      style={{ borderTopWidth: "4px", borderTopColor: style.borderColor }}
    >
      {/* Inactive badge */}
      {isInactive && (
        <Badge className="absolute top-2 right-2 bg-red-900/60 text-red-300 text-[10px]">
          Inactivo
        </Badge>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{style.emoji}</span>
            <CardTitle className="text-lg leading-6 font-bold text-[var(--primary-text)] line-clamp-2">
              {product.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {product.slug && (
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-300 px-2 py-0.5 rounded"
              >
                {product.slug}
              </Badge>
            )}
            {product.description && (
              <span className="text-muted-foreground text-xs line-clamp-1">
                {product.description}
              </span>
            )}
          </div>
        </div>

        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[var(--card-border)]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[var(--card-background)] border-[var(--card-border)] text-white"
            >
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(product);
                  }}
                  className="text-white hover:bg-[var(--card-border)] cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  {onEdit && (
                    <DropdownMenuSeparator className="bg-[var(--card-border)]" />
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(product);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-extrabold tabular-nums text-[var(--primary-text)]">
          {formatARS(product.price)}
        </div>
      </div>
    </Card>
  );
}

export default ProductCard;
