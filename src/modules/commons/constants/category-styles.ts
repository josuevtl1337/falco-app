export interface CategoryStyle {
  emoji: string;
  borderColor: string;
  bgTint: string;
}

const CATEGORY_STYLE_MAP: Record<string, CategoryStyle> = {
  "Café": {
    emoji: "☕",
    borderColor: "#D97706",
    bgTint: "rgba(217,119,6,0.12)",
  },
  "Para Acompañar": {
    emoji: "🥐",
    borderColor: "#EA580C",
    bgTint: "rgba(234,88,12,0.12)",
  },
  "Otras Opciones": {
    emoji: "🥤",
    borderColor: "#0891B2",
    bgTint: "rgba(8,145,178,0.12)",
  },
  "Extras": {
    emoji: "✨",
    borderColor: "#A855F7",
    bgTint: "rgba(168,85,247,0.12)",
  },
  "Envasados": {
    emoji: "🧴",
    borderColor: "#16A34A",
    bgTint: "rgba(22,163,74,0.12)",
  },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  emoji: "📦",
  borderColor: "#6B7280",
  bgTint: "rgba(107,114,128,0.12)",
};

export function getCategoryStyle(categoryName?: string): CategoryStyle {
  if (!categoryName) return DEFAULT_CATEGORY_STYLE;
  return CATEGORY_STYLE_MAP[categoryName] ?? DEFAULT_CATEGORY_STYLE;
}
