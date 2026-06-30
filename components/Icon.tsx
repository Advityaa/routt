import {
  Wifi,
  Wallet,
  FileCheck2,
  BookUser,
  ShieldCheck,
  Smartphone,
  Luggage,
  Compass,
  Route,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

/**
 * One consistent icon set (lucide) used across task categories, sections and
 * cards. Thin wrapper so the rest of the app references icons by a stable name
 * and inherits color/size from the parent (currentColor).
 */
export type IconName =
  | "visa"
  | "passport"
  | "insurance"
  | "money"
  | "connectivity"
  | "apps"
  | "arrival"
  | "shield"
  | "compass"
  | "route"
  | "sparkle"
  | "star";

const ICONS: Record<IconName, LucideIcon> = {
  visa: FileCheck2,
  passport: BookUser,
  insurance: ShieldCheck,
  money: Wallet,
  connectivity: Wifi,
  apps: Smartphone,
  arrival: Luggage,
  shield: ShieldCheck,
  compass: Compass,
  route: Route,
  sparkle: Sparkles,
  star: Star,
};

const CATEGORY_ICON: Record<string, IconName> = {
  visa: "visa",
  passport: "passport",
  insurance: "insurance",
  money: "money",
  connectivity: "connectivity",
  apps: "apps",
  arrival: "arrival",
};

export function categoryIcon(category: string): IconName {
  return CATEGORY_ICON[category] ?? "sparkle";
}

export default function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const Cmp = ICONS[name];
  return <Cmp className={className} strokeWidth={1.75} aria-hidden />;
}
