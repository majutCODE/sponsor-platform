import { Bike, Car, Gem, Guitar, Package, Shirt, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "Prom & formal wear": Gem,
  Cars: Car,
  Motorbikes: Bike,
  "Sports kits": Shirt,
  Guitars: Guitar,
};

export default function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className ?? "h-4 w-4"} strokeWidth={1.75} aria-hidden />;
}
