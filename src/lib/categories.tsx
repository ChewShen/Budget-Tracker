import {
  Car,
  CircleDashed,
  Clapperboard,
  HeartPulse,
  Home,
  Music,
  Repeat,
  ShoppingBag,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Food: Utensils,
  Transport: Car,
  Home_Bills: Home,
  Self_care: Sparkles,
  Subscription: Repeat,
  Health: HeartPulse,
  Own_Interest: Music,
  Entertainment: Clapperboard,
  Shopping: ShoppingBag,
  Others: CircleDashed,
};

export function categoryIcon(name?: string): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || CircleDashed;
}

// "Home_Bills" -> "Home Bills"
export function categoryLabel(name?: string): string {
  return (name || "Others").replace(/_/g, " ");
}

export function CategoryIcon({
  name,
  className = "h-9 w-9",
}: {
  name?: string;
  className?: string;
}) {
  const Icon = categoryIcon(name);
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/80 ${className}`}
    >
      <Icon className="h-[45%] w-[45%]" strokeWidth={2} />
    </span>
  );
}
