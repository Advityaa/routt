/**
 * Worlds — the app's top-level surfaces. Country-agnostic: a world defines HOW
 * content is framed (icon, theme treatment, route); WHAT it shows comes from
 * the active city (lib/worlds/cities.ts). During migration each world points at
 * its existing screen; routes swap to /worlds/* one at a time without breakage.
 */
export interface WorldTheme {
  accentGrade: "full" | "muted"; // how loudly the world uses the brand accent
  imagery: "photo-hero" | "document" | "list"; // hero photo vs travel-document vs plain list framing
}
export interface WorldDef {
  id: string;
  label: string;
  icon: "map-pin" | "bookmark" | "plane" | "calendar";
  theme: WorldTheme;
  route: string; // current live route (legacy screens until migrated)
}
export const WORLDS: WorldDef[] = [
  { id: "now", label: "Now", icon: "map-pin", theme: { accentGrade: "full", imagery: "photo-hero" }, route: "/" },
  { id: "trip", label: "Trip", icon: "bookmark", theme: { accentGrade: "muted", imagery: "document" }, route: "/trip" },
  { id: "arrival", label: "Arrival", icon: "plane", theme: { accentGrade: "muted", imagery: "document" }, route: "/arrival" },
  { id: "events", label: "Events", icon: "calendar", theme: { accentGrade: "muted", imagery: "list" }, route: "/events" },
];
