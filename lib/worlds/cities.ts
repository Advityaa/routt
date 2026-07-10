/**
 * Cities/destinations — the active destination drives every world's content.
 * dataMode says what's real today: Bangkok has the extracted Overture store;
 * others run on mock/curated until extracted (npm run extract -- <id>).
 */
export interface CityDef {
  id: string;
  label: string;
  country: string; // ISO-3166 alpha-2
  lat: number;
  lng: number;
  dataMode: "real" | "mock";
  events: "ticketmaster" | "curated";
}
export const CITIES: CityDef[] = [
  { id: "bangkok", label: "Bangkok", country: "TH", lat: 13.7376, lng: 100.5602, dataMode: "real", events: "curated" },
  { id: "dubai", label: "Dubai", country: "AE", lat: 25.2048, lng: 55.2708, dataMode: "mock", events: "ticketmaster" },
  { id: "singapore", label: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198, dataMode: "mock", events: "curated" },
];
const KEY = "routt.activeCity";
export function getActiveCity(): CityDef {
  try {
    const id = localStorage.getItem(KEY);
    return CITIES.find((c) => c.id === id) ?? CITIES[0];
  } catch { return CITIES[0]; }
}
export function setActiveCity(id: string) {
  try { localStorage.setItem(KEY, id); } catch {}
}
