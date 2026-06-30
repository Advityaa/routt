/**
 * Per-destination packing data. City coordinates are stored here so we never
 * need a separate geocoding call — they feed the Open-Meteo lookup directly.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export const CITY_COORDS: Record<string, LatLng> = {
  dubai: { lat: 25.2, lng: 55.27 },
  bangkok: { lat: 13.76, lng: 100.5 },
  singapore: { lat: 1.35, lng: 103.82 },
  bali: { lat: -8.65, lng: 115.22 },
  "abu-dhabi": { lat: 24.45, lng: 54.38 },
  "kuala-lumpur": { lat: 3.14, lng: 101.69 },
};

export function cityCoords(slug: string): LatLng | undefined {
  return CITY_COORDS[slug];
}

/** Destination-aware essentials (context the weather alone can't infer). */
export const DESTINATION_PACKING: Record<string, { label: string; reason: string }[]> = {
  dubai: [
    { label: "A modest layer (covers shoulders & knees)", reason: "Needed for mosques and respectful for malls in Dubai" },
    { label: "A light layer for fierce indoor AC", reason: "Dubai malls, metro and restaurants run cold" },
  ],
  "abu-dhabi": [
    { label: "Modest dress for the Grand Mosque", reason: "Long sleeves/trousers required at Sheikh Zayed Grand Mosque" },
    { label: "A light layer for indoor AC", reason: "Indoors in Abu Dhabi runs cold" },
  ],
  bangkok: [
    { label: "Temple cover (shoulders & knees)", reason: "Required at the Grand Palace and Bangkok temples" },
  ],
  singapore: [
    { label: "A light layer for strong AC", reason: "Singapore runs cold indoors year-round" },
  ],
  bali: [
    { label: "Mosquito repellent", reason: "Useful across Bali's tropical, rural areas" },
    { label: "A sarong", reason: "Required to enter many Balinese temples" },
  ],
  "kuala-lumpur": [
    { label: "A light layer for mall AC", reason: "KL malls run cold" },
  ],
};

export interface ActivityDef {
  key: string;
  label: string;
  items: string[];
}

/** Activity tags the user picks; each maps to concrete items. */
export const ACTIVITIES: ActivityDef[] = [
  { key: "beach", label: "Beach & swimming", items: ["Swimwear", "Flip-flops", "Quick-dry towel", "Reef-safe sunscreen"] },
  { key: "desert", label: "Desert safari", items: ["Closed-toe shoes", "A scarf for sand & sun", "Lip balm"] },
  { key: "hiking", label: "Hiking & outdoors", items: ["Proper walking/hiking shoes", "A small daypack"] },
  { key: "dining", label: "Fine dining", items: ["One smart-casual outfit"] },
  { key: "walking", label: "Lots of walking", items: ["Comfortable walking shoes"] },
  { key: "nightlife", label: "Nightlife", items: ["A dressier outfit"] },
];
