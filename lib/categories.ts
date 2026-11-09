export const CATEGORIES = [
  { name: "Cars", emoji: "🏎️" },
  { name: "Prom & formal wear", emoji: "👗" },
  { name: "Motorbikes", emoji: "🏍️" },
  { name: "Sports kits", emoji: "⚽" },
  { name: "Guitars", emoji: "🎸" },
  { name: "Other", emoji: "📦" },
] as const;

export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

// Listings created before the list was narrowed keep their stored category; this maps them onto the current six.
const LEGACY: Record<string, string> = {
  Clothing: "Sports kits",
  "Sports gear": "Sports kits",
  "Motorbikes & bikes": "Motorbikes",
  "Musical instruments": "Guitars",
  "Tech & gadgets": "Other",
  "Home & furniture": "Other",
};

export const categoryOf = (stored: string): string =>
  CATEGORY_NAMES.includes(stored) ? stored : LEGACY[stored] ?? "Other";
