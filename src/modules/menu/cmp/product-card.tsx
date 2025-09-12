import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { formatARS } from "@/modules/commons/utils/helpers";
import { IMenuItem as Product } from "./../../../../backend/models/MenuModel";

function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect?: (p: Product) => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Card
      role="button"
      onClick={() => onSelect?.(product)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border-2 border-[var(--primary-foreground)] p-6 shadow-lg transition-all hover:scale-[1.02] cursor-pointer",
        "hover:shadow-2xl hover:border-[var(--primary)] active:scale-[0.98]",
        product.is_active === 0 ? "opacity-60 grayscale" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-2xl leading-7 font-bold text-[var(--primary-text)]">
            {product.name}
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
        <div className="text-right">
          <div className="text-3xl font-extrabold tabular-nums text-[var(--primary-text)]">
            {formatARS(product.price)}
          </div>
          {/* {!product.isAvailable && (
            <div className="text-[11px] text-muted-foreground">
              No disponible
            </div>
          )} */}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-blue-200 dark:border-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(product.slug).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          <Copy className="mr-2 h-4 w-4" />{" "}
          {copied ? "Copiado" : "Copiar código"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Tocar para seleccionar
        </span>
      </div>
    </Card>
  );
}

export default ProductCard;
