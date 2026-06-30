/**
 * Lightweight world-map data. We avoid a heavy mapping library: countries are
 * plotted as dots on an equirectangular projection (viewBox 360×180, where
 * x = lng + 180 and y = 90 − lat), over a few soft continent blobs for context.
 *
 * The % uses the UN count (195) as the denominator; users pick from this
 * curated, well-spread list (self-declared — no tracking, no location data).
 */

export const TOTAL_COUNTRIES = 195;

export type Continent =
  | "Asia"
  | "Europe"
  | "Africa"
  | "North America"
  | "South America"
  | "Oceania";

export interface Country {
  code: string;
  name: string;
  lat: number;
  lng: number;
  continent: Continent;
}

export const COUNTRIES: Country[] = [
  // Asia
  { code: "IN", name: "India", lat: 22, lng: 79, continent: "Asia" },
  { code: "AE", name: "United Arab Emirates", lat: 24, lng: 54, continent: "Asia" },
  { code: "TH", name: "Thailand", lat: 15, lng: 101, continent: "Asia" },
  { code: "SG", name: "Singapore", lat: 1.3, lng: 103.8, continent: "Asia" },
  { code: "ID", name: "Indonesia", lat: -2, lng: 118, continent: "Asia" },
  { code: "MY", name: "Malaysia", lat: 4, lng: 102, continent: "Asia" },
  { code: "JP", name: "Japan", lat: 36, lng: 138, continent: "Asia" },
  { code: "CN", name: "China", lat: 35, lng: 103, continent: "Asia" },
  { code: "NP", name: "Nepal", lat: 28, lng: 84, continent: "Asia" },
  { code: "LK", name: "Sri Lanka", lat: 7, lng: 81, continent: "Asia" },
  { code: "VN", name: "Vietnam", lat: 16, lng: 108, continent: "Asia" },
  { code: "MV", name: "Maldives", lat: 3.2, lng: 73, continent: "Asia" },
  { code: "QA", name: "Qatar", lat: 25, lng: 51, continent: "Asia" },
  { code: "SA", name: "Saudi Arabia", lat: 24, lng: 45, continent: "Asia" },
  { code: "TR", name: "Türkiye", lat: 39, lng: 35, continent: "Asia" },
  { code: "KR", name: "South Korea", lat: 36, lng: 128, continent: "Asia" },
  { code: "PH", name: "Philippines", lat: 13, lng: 122, continent: "Asia" },
  { code: "KH", name: "Cambodia", lat: 12, lng: 105, continent: "Asia" },
  { code: "BT", name: "Bhutan", lat: 27, lng: 90, continent: "Asia" },
  { code: "IL", name: "Israel", lat: 31, lng: 35, continent: "Asia" },
  { code: "JO", name: "Jordan", lat: 31, lng: 36, continent: "Asia" },
  { code: "HK", name: "Hong Kong", lat: 22.3, lng: 114.2, continent: "Asia" },
  // Europe
  { code: "GB", name: "United Kingdom", lat: 54, lng: -2, continent: "Europe" },
  { code: "FR", name: "France", lat: 46, lng: 2, continent: "Europe" },
  { code: "DE", name: "Germany", lat: 51, lng: 10, continent: "Europe" },
  { code: "IT", name: "Italy", lat: 42, lng: 13, continent: "Europe" },
  { code: "ES", name: "Spain", lat: 40, lng: -4, continent: "Europe" },
  { code: "CH", name: "Switzerland", lat: 47, lng: 8, continent: "Europe" },
  { code: "NL", name: "Netherlands", lat: 52, lng: 5, continent: "Europe" },
  { code: "GR", name: "Greece", lat: 39, lng: 22, continent: "Europe" },
  { code: "PT", name: "Portugal", lat: 39, lng: -8, continent: "Europe" },
  { code: "IS", name: "Iceland", lat: 65, lng: -18, continent: "Europe" },
  { code: "NO", name: "Norway", lat: 62, lng: 10, continent: "Europe" },
  { code: "SE", name: "Sweden", lat: 62, lng: 15, continent: "Europe" },
  { code: "AT", name: "Austria", lat: 47, lng: 14, continent: "Europe" },
  { code: "IE", name: "Ireland", lat: 53, lng: -8, continent: "Europe" },
  { code: "CZ", name: "Czechia", lat: 50, lng: 15, continent: "Europe" },
  { code: "HR", name: "Croatia", lat: 45, lng: 16, continent: "Europe" },
  { code: "RU", name: "Russia", lat: 61, lng: 100, continent: "Europe" },
  // Africa
  { code: "EG", name: "Egypt", lat: 26, lng: 30, continent: "Africa" },
  { code: "MA", name: "Morocco", lat: 32, lng: -6, continent: "Africa" },
  { code: "ZA", name: "South Africa", lat: -30, lng: 25, continent: "Africa" },
  { code: "KE", name: "Kenya", lat: 0, lng: 38, continent: "Africa" },
  { code: "TZ", name: "Tanzania", lat: -6, lng: 35, continent: "Africa" },
  { code: "MU", name: "Mauritius", lat: -20, lng: 57, continent: "Africa" },
  { code: "NG", name: "Nigeria", lat: 9, lng: 8, continent: "Africa" },
  { code: "ET", name: "Ethiopia", lat: 9, lng: 40, continent: "Africa" },
  { code: "SC", name: "Seychelles", lat: -4.6, lng: 55.5, continent: "Africa" },
  // North America
  { code: "US", name: "United States", lat: 39, lng: -98, continent: "North America" },
  { code: "CA", name: "Canada", lat: 56, lng: -106, continent: "North America" },
  { code: "MX", name: "Mexico", lat: 23, lng: -102, continent: "North America" },
  { code: "CR", name: "Costa Rica", lat: 10, lng: -84, continent: "North America" },
  { code: "CU", name: "Cuba", lat: 22, lng: -79, continent: "North America" },
  { code: "JM", name: "Jamaica", lat: 18, lng: -77, continent: "North America" },
  // South America
  { code: "BR", name: "Brazil", lat: -10, lng: -55, continent: "South America" },
  { code: "AR", name: "Argentina", lat: -38, lng: -65, continent: "South America" },
  { code: "PE", name: "Peru", lat: -10, lng: -76, continent: "South America" },
  { code: "CL", name: "Chile", lat: -35, lng: -71, continent: "South America" },
  { code: "CO", name: "Colombia", lat: 4, lng: -73, continent: "South America" },
  // Oceania
  { code: "AU", name: "Australia", lat: -25, lng: 133, continent: "Oceania" },
  { code: "NZ", name: "New Zealand", lat: -42, lng: 174, continent: "Oceania" },
  { code: "FJ", name: "Fiji", lat: -17, lng: 178, continent: "Oceania" },
];

/** Map a destination slug to its country code (for auto-stamping a visited country). */
export const DESTINATION_COUNTRY: Record<string, string> = {
  dubai: "AE",
  "abu-dhabi": "AE",
  bangkok: "TH",
  singapore: "SG",
  bali: "ID",
  "kuala-lumpur": "MY",
};

/** Equirectangular projection into the 360×180 viewBox. */
export function project(lat: number, lng: number): { x: number; y: number } {
  return { x: lng + 180, y: 90 - lat };
}

/** Soft continent blobs (ellipses) for map context — abstract, not precise. */
export const CONTINENT_BLOBS: { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 80, cy: 45, rx: 34, ry: 25 }, // North America
  { cx: 120, cy: 110, rx: 15, ry: 30 }, // South America
  { cx: 193, cy: 40, rx: 17, ry: 13 }, // Europe
  { cx: 202, cy: 92, rx: 22, ry: 32 }, // Africa
  { cx: 278, cy: 48, rx: 50, ry: 30 }, // Asia
  { cx: 315, cy: 118, rx: 18, ry: 13 }, // Oceania
];

export function continentsVisited(visitedCodes: string[]): number {
  const set = new Set(
    COUNTRIES.filter((c) => visitedCodes.includes(c.code)).map((c) => c.continent)
  );
  return set.size;
}
