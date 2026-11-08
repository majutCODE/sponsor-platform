import { Bike, Car, Dumbbell, Gem, Guitar, Laptop, Package, Shirt, Sofa, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "Prom & formal wear": Gem,
  Clothing: Shirt,
  Cars: Car,
  "Motorbikes & bikes": Bike,
  "Sports gear": Dumbbell,
  "Musical instruments": Guitar,
  "Tech & gadgets": Laptop,
  "Home & furniture": Sofa,
};

export default function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className ?? "h-4 w-4"} strokeWidth={1.75} aria-hidden />;
}
