import { cn } from "@/lib/utils";
import { formatARS } from "@/modules/commons/utils/helpers";
import { getCategoryStyle } from "@/modules/commons/constants/category-styles";
import type { OrderProduct } from "@/modules/hall/hooks/useMenuData";

interface PosProductCardProps {
  product: OrderProduct;
  onSelect: (product: OrderProduct) => void;
  disabled?: boolean;
}

function PosProductCard({ product, onSelect, disabled }: PosProductCardProps) {
  const style = getCategoryStyle(product.category_name ?? undefined);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      disabled={disabled}
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-[var(--card-border)] p-3 text-left transition-all",
        "bg-[var(--card-background)] hover:border-[var(--primary)] hover:scale-[1.02] active:scale-[0.97]",
        "cursor-pointer min-h-[90px]",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:border-[var(--card-border)]",
        product.is_active === 0 && "opacity-40 grayscale"
      )}
      style={{ borderTopWidth: "3px", borderTopColor: style.borderColor }}
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-none">{style.emoji}</span>
        <span className="text-sm font-semibold text-[var(--primary-text)] line-clamp-2 leading-tight flex-1">
          {product.name}
        </span>
      </div>
      <div className="mt-2 text-lg font-bold tabular-nums text-[var(--primary-text)]">
        {formatARS(product.price)}
      </div>
    </button>
  );
}

export default PosProductCard;
