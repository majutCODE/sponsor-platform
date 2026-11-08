export const CATEGORIES = [
  { name: "Prom & formal wear", emoji: "👗" },
  { name: "Clothing", emoji: "👕" },
  { name: "Cars", emoji: "🏎️" },
  { name: "Motorbikes & bikes", emoji: "🏍️" },
  { name: "Sports gear", emoji: "⚽" },
  { name: "Musical instruments", emoji: "🎸" },
  { name: "Tech & gadgets", emoji: "💻" },
  { name: "Home & furniture", emoji: "🛋️" },
  { name: "Other", emoji: "📦" },
] as const;

export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);
