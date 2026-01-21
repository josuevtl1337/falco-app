import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { formatARS } from "@/modules/commons/utils/helpers";
import { OrderProduct } from "@/modules/hall";
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
  product: OrderProduct;
  onSelect?: (p: OrderProduct) => void;
  onUpdateQty?: (productId: string, qty: number) => void;
  onEdit?: (p: OrderProduct) => void;
  onDelete?: (p: OrderProduct) => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Card
      role="button"
      onClick={() => onSelect?.(product)}
      className={cn(
        "bg-[var(--card-background)] group relative flex flex-col justify-between rounded-2xl border-1 border-[var(--card-border)] p-4 shadow-lg transition-all hover:scale-[1.02] cursor-pointer",
        "hover:shadow-2xl hover:border-[var(--primary)] active:scale-[0.98]",
        product.is_active === 0 ? "opacity-60 grayscale" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-xl leading-7 font-bold text-[var(--primary-text)]">
            {/* {product.name} */}
            {product.name.length > 15
              ? product.name.slice(0, 15) + "..."
              : product.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-blue-300 px-2 py-1 rounded"
              aria-label={`Código ${product.slug}`}
            >
              {product.slug}
            </Badge>
            {product.description ? (
              <span className="text-muted-foreground text-xs">
                {product.description}
              </span>
            ) : null}
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

      <div className="mt-4 flex flex-col items-start justify-between gap-2">
        <div className="text-start">
          <div className="text-3xl font-extrabold tabular-nums text-[var(--primary-text)]">
            {formatARS(product.price)}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          Tocar para seleccionar
        </span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-blue-200 dark:border-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(product.slug || "").then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          <Copy className="mr-2 h-4 w-4" />{" "}
          {copied ? "Copiado" : "Copiar código"}
        </Button>
      </div>
    </Card>
  );
}

export default ProductCard;
