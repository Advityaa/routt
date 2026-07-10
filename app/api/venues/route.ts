import { NextResponse } from "next/server";
import {
  loadCity,
  toAppCategory,
  distanceMeters,
  type VenueRow,
} from "@/lib/venues/store";
import { rollupSignals, allReviews, listingQuality, type RolledSignals } from "@/lib/ugc/store";

/**
 * SERVING layer — GET /api/venues?city=bangkok&lat=..&lng=..&category=eat&limit=30
 *
 * Serves venues from OUR store (Overture-extracted skeleton + separate
 * first-party signals), never from Overture/OSM at runtime. The UI consumes
 * this via the dataProvider — it never queries sources directly.
 */
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export interface ServedVenue extends VenueRow {
  app_category: "eat" | "drink" | "shop" | "see" | null;
  distance_m: number | null;
  /** Rolled up from FIRST-PARTY venue_reviews only — real, never seeded. */
  signals: RolledSignals;
  /** Listing metadata from Overture confidence/completeness — NOT a verdict. */
  listing_quality: "established" | "limited";
}

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const city = q.get("city") ?? "bangkok";
  const file = loadCity(city);
  if (!file) return NextResponse.json({ error: `no venue data for city '${city}' — run: npm run extract -- ${city}` }, { status: 404 });

  const lat = q.get("lat") ? Number(q.get("lat")) : null;
  const lng = q.get("lng") ? Number(q.get("lng")) : null;
  const category = q.get("category");
  const minConfidence = Number(q.get("minConfidence") ?? 0.5);
  const limit = Math.min(MAX_LIMIT, Number(q.get("limit") ?? DEFAULT_LIMIT));
  const reviews = allReviews(); // read once, roll up per venue

  // Single-venue lookup by GERS id (used by the detail screen in db mode).
  const id = q.get("id");
  let pool = file.venues;
  if (id) pool = pool.filter((v) => v.gers_id === id);

  // Name search (paste-a-link resolver): distinctive-token match, ≥50% of the
  // venue's name tokens must appear in the query — same rule as the mock path.
  const text = q.get("q")?.toLowerCase();
  if (text) {
    const qTokens = new Set(text.split(/[^a-z0-9]+/).filter((w) => w.length >= 2));
    pool = pool
      .map((v) => {
        const nameTokens = v.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
        if (!nameTokens.length) return { v, score: 0 };
        const matched = nameTokens.filter((t) => qTokens.has(t)).length;
        return { v, score: matched >= 1 ? matched / nameTokens.length : 0 };
      })
      .filter((x) => x.score >= 0.5)
      .sort((a, b) => b.score - a.score || (b.v.confidence ?? 0) - (a.v.confidence ?? 0))
      .map((x) => x.v);
  }

  let rows: ServedVenue[] = pool
    .filter((v) => id || (v.confidence ?? 1) >= minConfidence)
    .map((v) => ({
      ...v,
      app_category: toAppCategory(v),
      distance_m: lat != null && lng != null ? distanceMeters(lat, lng, v.lat, v.lng) : null,
      signals: rollupSignals(v.gers_id, reviews),
      listing_quality: listingQuality(v),
    }));

  if (category) rows = rows.filter((v) => v.app_category === category);
  // Name-search results keep score order (best match first) — distance sort
  // would let a nearer partial match beat an exact name match.
  if (!text && lat != null && lng != null) rows.sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));

  return NextResponse.json({
    city,
    release: file.release,
    extracted_at: file.extracted_at,
    attribution: [file.attribution, "© OpenStreetMap contributors (ODbL) where source='osm'"],
    total_in_city: file.venues.length,
    count: Math.min(rows.length, limit),
    venues: rows.slice(0, limit),
  });
}
