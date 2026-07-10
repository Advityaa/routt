import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * GAP-FILL — OSM/Nominatim helper for places missing from our Overture snapshot
 * and one-off geocodes (e.g. a user-pasted address). SERVER ONLY.
 *
 * Nominatim usage policy compliance (https://operations.osmfoundation.org/policies/nominatim/):
 *  • ≤1 request/second — enforced by a global serial queue with a 1100ms gap
 *  • Descriptive User-Agent identifying Routt
 *  • Results cached to disk — a query is never re-sent
 *  • NEVER used for bulk work — Overture extract is the bulk path; this is for gaps
 *
 * Results are ODbL (© OpenStreetMap contributors) — kept flagged source='osm'
 * so licensing stays traceable (see README "Licensing").
 */

const CACHE_PATH = join(process.cwd(), "data/cache/nominatim.json");
const USER_AGENT = "Routt/0.1 (travel companion app; dev contact: aggarwal.adv@northeastern.edu)";
const MIN_GAP_MS = 1100; // ≤1 req/sec, with margin

export interface OsmPlace {
  osm_id: string;
  name: string;
  lat: number;
  lng: number;
  display_name: string;
  category: string | null;
  source: "osm";
  attribution: "© OpenStreetMap contributors (ODbL)";
}

function readCache(): Record<string, OsmPlace | null> {
  try {
    return existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};
  } catch {
    return {};
  }
}
function writeCache(c: Record<string, OsmPlace | null>) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(c, null, 1));
}

// Global serial queue — all callers share it, so the 1 rps cap holds process-wide.
let chain: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Geocode a free-text place/address. Cache-first; one live request max/sec. */
export function nominatimLookup(query: string, near?: { lat: number; lng: number }): Promise<OsmPlace | null> {
  const key = `${query.trim().toLowerCase()}|${near ? `${near.lat.toFixed(2)},${near.lng.toFixed(2)}` : ""}`;
  const result = chain.then(async () => {
    const cache = readCache();
    if (key in cache) return cache[key]; // cached (including cached misses)

    const wait = Math.max(0, lastRequestAt + MIN_GAP_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();

    const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1", addressdetails: "0" });
    if (near) {
      // Bias results toward the user's area (viewbox is a soft preference).
      const d = 0.25;
      params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null; // transient failure: do NOT cache, may retry later

    const hits = (await res.json()) as { osm_type?: string; osm_id?: number; name?: string; display_name?: string; lat: string; lon: string; category?: string; type?: string }[];
    const hit = hits[0];
    const place: OsmPlace | null = hit
      ? {
          osm_id: `${hit.osm_type ?? "node"}/${hit.osm_id ?? 0}`,
          name: hit.name || hit.display_name?.split(",")[0] || query,
          lat: Number(hit.lat),
          lng: Number(hit.lon),
          display_name: hit.display_name ?? "",
          category: hit.type ?? hit.category ?? null,
          source: "osm",
          attribution: "© OpenStreetMap contributors (ODbL)",
        }
      : null;

    cache[key] = place; // cache hits AND definitive misses
    writeCache(cache);
    return place;
  });
  chain = result.catch(() => {}); // keep the queue alive on errors
  return result;
}

/** Reverse-geocode to a human area label ("Khlong Toei, Bangkok"), English
 *  preferred. Same serial queue + disk cache as lookup (≤1 req/s total). */
export function nominatimReverse(lat: number, lng: number): Promise<string | null> {
  const key = `rev|${lat.toFixed(3)},${lng.toFixed(3)}`;
  const result = chain.then(async () => {
    const cache = readCache() as Record<string, unknown>;
    if (key in cache) return cache[key] as string | null;
    const wait = Math.max(0, lastRequestAt + MIN_GAP_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: "jsonv2", zoom: "14", "accept-language": "en" });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null; // transient: don't cache
    const j = (await res.json()) as { address?: Record<string, string> };
    const a = j.address ?? {};
    const area = a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district ?? a.borough ?? null;
    const city = a.city ?? a.town ?? a.municipality ?? a.state ?? null;
    const label = area && city ? `${area}, ${city}` : city ?? area ?? null;
    (cache as Record<string, string | null>)[key] = label;
    writeCache(cache as never);
    return label;
  });
  chain = result.catch(() => {});
  return result as Promise<string | null>;
}
