import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Server-side venue store — v1 reads the per-city JSON written by
 * scripts/extract-city.mjs (venues) and data/signals/ (first-party UGC).
 * Same shapes as db/schema.sql; swapping to Postgres/PostGIS changes only this
 * file. SERVER ONLY (fs) — the UI reaches it via /api/venues.
 */

export interface VenueRow {
  gers_id: string;
  name: string; // display name (English/romanized when available)
  name_local?: string | null; // names.primary in local script (e.g. Thai)
  basic_category: string | null;
  taxonomy: string | null;
  lat: number;
  lng: number;
  address: string | null;
  locality: string | null;
  website: string | null;
  phone: string | null;
  confidence: number | null;
  source: "overture" | "osm";
  last_synced: string;
}

export interface VenueSignals {
  rating: number | null;
  review_count: number;
  still_open_votes: number;
  tips: string[];
  fairness_price_low: number | null;
  fairness_price_high: number | null;
  is_seed_demo: boolean; // NEVER present seed rows as verified
  updated_at: string;
}

export interface CityVenueFile {
  city: string;
  city_name: string;
  release: string;
  extracted_at: string;
  attribution: string;
  venues: VenueRow[];
}

const ROOT = process.cwd();
const cache = new Map<string, CityVenueFile | null>();
const signalsCache = new Map<string, Record<string, VenueSignals>>();

export function loadCity(city: string): CityVenueFile | null {
  if (!/^[a-z0-9-]+$/.test(city)) return null; // path safety
  if (!cache.has(city)) {
    const p = join(ROOT, "data/venues", `${city}.json`);
    cache.set(city, existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as CityVenueFile) : null);
  }
  return cache.get(city) ?? null;
}

export function loadSignals(city: string): Record<string, VenueSignals> {
  if (!signalsCache.has(city)) {
    const p = join(ROOT, "data/signals", `${city}.json`);
    signalsCache.set(
      city,
      existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")).signals ?? {}) : {},
    );
  }
  return signalsCache.get(city)!;
}

/** Map an Overture basic_category / taxonomy string onto Routt's 4 categories. */
export function toAppCategory(v: VenueRow): "eat" | "drink" | "shop" | "see" | null {
  const hay = `${v.basic_category ?? ""} ${v.taxonomy ?? ""}`.toLowerCase();
  if (!hay.trim()) return null;
  if (/bar|pub|night_?club|brewery|cocktail|beer|wine|lounge/.test(hay)) return "drink";
  if (/restaurant|food|cafe|coffee|bakery|dessert|noodle|street_?vendor|eating/.test(hay)) return "eat";
  if (/shop|store|market|mall|retail|boutique|bookstore|grocer/.test(hay)) return "shop";
  if (/museum|temple|park|gallery|landmark|attraction|monument|garden|zoo|theat|viewpoint|historic|tourism/.test(hay)) return "see";
  return null; // offices, clinics, etc — not a Routt category
}

const toRad = (d: number) => (d * Math.PI) / 180;
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const h =
    Math.sin(toRad(bLat - aLat) / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(toRad(bLng - aLng) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
}
