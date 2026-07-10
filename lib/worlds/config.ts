/**
 * Worlds — Routt's top-level spaces. Country-agnostic; the active city
 * (lib/worlds/cities.ts) supplies content, the world supplies framing.
 * `tint` gives each world its subtle atmosphere while chrome stays Routt green.
 * Routes point at each world's live screen; ?cat= presets the feed's lens.
 */
export interface WorldDef {
  id: string;
  label: string;
  short: string; // nav label
  icon: "compass" | "utensils" | "music" | "mountain" | "bookmark" | "user";
  tint: string; // per-world wash behind the screen (entering a new space)
  route: string;
}
export const WORLDS: WorldDef[] = [
  { id: "explore", label: "Explore", short: "Explore", icon: "compass", tint: "rgba(31,138,91,0.05)", route: "/" },
  { id: "food", label: "Food", short: "Food", icon: "utensils", tint: "rgba(178,58,46,0.05)", route: "/food" },
  { id: "nightlife", label: "Nightlife & Events", short: "Nights", icon: "music", tint: "rgba(28,26,60,0.06)", route: "/nights" },
  { id: "activities", label: "Activities", short: "Do", icon: "mountain", tint: "rgba(154,100,16,0.05)", route: "/do" },
  { id: "trip", label: "My Trip", short: "Trip", icon: "bookmark", tint: "rgba(31,138,91,0.04)", route: "/trip" },
  { id: "me", label: "Me", short: "Me", icon: "user", tint: "rgba(107,102,92,0.05)", route: "/me" },
];
