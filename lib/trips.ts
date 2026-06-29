import fs from "node:fs";
import path from "node:path";
import type { CatalogueEntry, TripDestination } from "./trip-types";

/**
 * Server-only loader for the countdown's per-destination JSON data.
 *
 * Adding a new destination = drop a `<slug>.json` file in content/destinations/.
 * No code change: the file appears in the catalogue as "live" automatically.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "destinations");

/**
 * Destinations we don't yet have verified data for — shown in the dropdown as
 * "coming soon" (disabled). They graduate to live the moment a matching JSON
 * file lands. (Per v1: never offer a destination we haven't verified.)
 */
const COMING_SOON: Omit<CatalogueEntry, "live">[] = [
  { slug: "bangkok", title: "Bangkok", flag: "🇹🇭", country: "Thailand" },
  { slug: "singapore", title: "Singapore", flag: "🇸🇬", country: "Singapore" },
  { slug: "bali", title: "Bali", flag: "🇮🇩", country: "Indonesia" },
];

function liveSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Full verified data for one destination, or null if we have no JSON for it. */
export function getTripDestination(slug: string): TripDestination | null {
  const file = path.join(CONTENT_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as TripDestination;
  } catch {
    return null;
  }
}

/** Live destinations (from JSON) first, then the coming-soon stubs. */
export function getTripCatalogue(): CatalogueEntry[] {
  const live = liveSlugs()
    .map((slug) => getTripDestination(slug))
    .filter((d): d is TripDestination => d !== null)
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      flag: d.flag,
      country: d.country,
      live: true,
    }));

  const liveSet = new Set(live.map((d) => d.slug));
  const soon = COMING_SOON.filter((d) => !liveSet.has(d.slug)).map((d) => ({
    ...d,
    live: false,
  }));

  return [...live, ...soon];
}
