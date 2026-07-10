import type { Category, CredibilityResult, Event, Place, ScoredPlace } from "./types";
import { scoreCredibility } from "./credibility";
import { mockEvents } from "./mock";
import { sources, sourceByName, mergeCluster } from "./sources";
import { resolvePlaces } from "./resolve";
import { USE_MOCK } from "./sources/config";

/**
 * Routt v1 — THE single data-access boundary.
 *
 * Nothing in the UI talks to a data source directly; everything goes through
 * here. This module ORCHESTRATES the pluggable sources (lib/sources/*):
 *
 *     sources.searchNearby → resolve/merge (cross-check) → score → Place
 *
 * v1 sources return reshaped mock data (USE_MOCK=true), so the pipeline runs
 * offline and produces the exact same `Place`s the app has always used. Wiring
 * real APIs (Google / Foursquare / Reddit) changes only lib/sources/* — never
 * this file's outputs, and never the UI.
 *
 * (Events are a separate domain — Songkick-shaped — and still read from mock
 * directly; they'll get their own source adapter in a later step.)
 */

/**
 * DATA_MODE: "mock" (default — the demo dataset + credibility pipeline) or
 * "db" — OUR extracted venue store (Overture skeleton + first-party signals)
 * served by /api/venues. In db mode venues have no review corpus yet, so the
 * engine honestly returns "unrated" — seed/demo signals are never presented
 * as verified verdicts.
 */
const DATA_MODE = (process.env.NEXT_PUBLIC_DATA_MODE ?? "mock") as "mock" | "db";

interface ServedVenueDTO {
  gers_id: string;
  name: string;
  name_local?: string | null;
  lat: number;
  lng: number;
  address: string | null;
  locality: string | null;
  confidence: number | null;
  app_category: Category | null;
  distance_m: number | null;
  listing_quality?: "established" | "limited";
  signals?: {
    verdict_state: "not-rated" | "early" | "still-good" | "mixed" | "fading";
    review_count_90d: number;
    local_count_90d: number;
    local_pct: number | null;
    avg_rating: number | null;
  };
}

/**
 * FIRST-PARTY verdict — asserts only when real venue_reviews cross the rollup
 * threshold; below it we stay honest ("not rated" / "early signals"). Counts in
 * reasons are the true stored counts, never fabricated.
 */
function venueCredibility(v: ServedVenueDTO): CredibilityResult {
  const s = v.signals;
  if (!s || s.verdict_state === "not-rated") {
    return {
      verdict: "unrated",
      score: 50,
      lowConfidence: true,
      reasons: ["No traveller reports yet — be the first"],
    };
  }
  if (s.verdict_state === "early") {
    return {
      verdict: "unrated",
      score: 50,
      lowConfidence: true,
      reasons: [`Early signals — ${s.review_count_90d} traveller report${s.review_count_90d === 1 ? "" : "s"} so far`],
    };
  }
  const reasons = [
    `${s.review_count_90d} traveller reports in the last 90 days`,
    s.local_pct != null ? `${s.local_pct}% from locals` : "",
    s.avg_rating != null ? `Running ${s.avg_rating}/5 recently` : "",
  ].filter(Boolean);
  return {
    verdict: s.verdict_state,
    score: Math.round((s.avg_rating ?? 2.5) * 20),
    lowConfidence: false,
    reasons: reasons.slice(0, 3),
  };
}

/** Map a served venue (skeleton, no UGC yet) onto the Place shape the UI uses. */
function venueToPlace(v: ServedVenueDTO, category: Category): Place {
  return {
    id: v.gers_id,
    name: v.name,
    nameLocal: v.name_local && v.name_local !== v.name ? v.name_local : undefined,
    category,
    lat: v.lat,
    lng: v.lng,
    neighborhood: v.locality ?? v.address ?? "",
    priceLevel: 2,
    homeCurrencyEstimate: "",
    rawRating: 0,
    reviewCount: 0, // no first-party corpus yet → engine yields "unrated" (honest)
    reviews: [],
    recentReviewCount90d: 0,
    reviewVelocityTrend: "steady",
    busyByHour: new Array(24).fill(0),
    crossSourceAgreement: 0,
    photos: [],
  };
}

async function fetchVenues(params: Record<string, string>): Promise<ServedVenueDTO[]> {
  const q = new URLSearchParams({ city: "bangkok", ...params });
  const res = await fetch(`/api/venues?${q}`);
  if (!res.ok) return [];
  return (await res.json()).venues ?? [];
}

const CATEGORIES: Category[] = ["eat", "drink", "shop", "see"];
// Used when a lookup isn't tied to the user's live location (saved trip, pasted
// link, area label fallback). Mock search ignores coordinates anyway.
const BANGKOK_CENTER = { lat: 13.7563, lng: 100.5018 };

/** Great-circle distance in meters (Haversine). Pure. */
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(a))));
}

// ── the source pipeline ──────────────────────────────────────────────────────
/** Fetch + resolve + merge one category near a point into normalized Places.
 *  MOCK (default): runs the mock adapters entirely in-browser (offline-safe).
 *  REAL: calls our own /api/places endpoint — the server holds the keys and
 *  runs the real adapters; the client never imports server code or sees a key. */
async function fetchCategory(category: Category, lat: number, lng: number): Promise<Place[]> {
  if (!USE_MOCK) return fetchRealCategory(category, lat, lng);
  const perSource = await Promise.all(sources.map((s) => s.searchNearby(category, lat, lng)));
  // Entity resolution: cross-check the same real place across sources.
  const resolved = resolvePlaces(perSource.flat());
  return Promise.all(
    resolved.map(async (rp) => {
      const details = await Promise.all(
        rp.sources.map((m) => sourceByName.get(m.sourceName)!.getDetails(m.sourceId)),
      );
      // (rp.matchConfidence + rp.sources provenance are available here for the UI
      // to surface later; the Place shape stays unchanged for now.)
      // consultedSources = how many sources we asked, so presence/corroboration
      // is measured against the full panel, not just the ones that matched.
      return mergeCluster(rp, details, sources.length);
    }),
  );
}

/** REAL mode: ask our own server endpoint (which holds the keys). */
async function fetchRealCategory(category: Category, lat: number, lng: number): Promise<Place[]> {
  const res = await fetch(`/api/places?category=${category}&lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error(`/api/places responded ${res.status}`);
  const data = (await res.json()) as { places: Place[] };
  return data.places;
}

/** All categories merged — for id/saved/paste/area lookups. */
async function fetchAllPlaces(lat: number, lng: number): Promise<Place[]> {
  const byCategory = await Promise.all(CATEGORIES.map((c) => fetchCategory(c, lat, lng)));
  return byCategory.flat();
}

// Relevance weights: credibility leads (the product decides FOR the user on
// quality), distance matters (it's "near me now"), and open/busy-right-now
// breaks ties toward places that are actually alive at this hour.
const REL = { credibility: 0.5, distance: 0.3, openBusy: 0.2 } as const;

// A verdict multiplier on top of the raw score so a tourist trap can never rank
// highly just by being close and busy.
const VERDICT_MULTIPLIER: Record<CredibilityResult["verdict"], number> = {
  "still-good": 1.0,
  fading: 0.7,
  "tourist-trap": 0.35,
  // unrated: unknown quality on thin data — rank cautiously in the middle, so a
  // brand-new place neither dominates the feed nor gets buried.
  unrated: 0.55,
  mixed: 0.6, // first-party "mixed" — mid-rank like unrated, slightly above
};

export interface NearbyQuery {
  category: Category;
  lat: number;
  lng: number;
  nowHour: number; // 0–23, user's local hour
}

/**
 * The single ranked feed. Returns the TOP 5 places for a category near a point,
 * ranked by credibility + distance + how alive the place is at `nowHour`.
 */
export async function getNearbyPlaces({
  category,
  lat,
  lng,
  nowHour,
}: NearbyQuery): Promise<ScoredPlace[]> {
  const hour = ((Math.round(nowHour) % 24) + 24) % 24;

  // db mode: nearest venues from OUR store; verdicts are honestly "unrated".
  if (DATA_MODE === "db") {
    const venues = await fetchVenues({
      lat: String(lat),
      lng: String(lng),
      category,
      limit: "5",
    });
    return venues.map((v) => ({
      place: venueToPlace(v, category),
      credibility: venueCredibility(v),
      distanceMeters: v.distance_m ?? 0,
    }));
  }

  const places = await fetchCategory(category, lat, lng);

  const scored = places
    .map((place) => {
      const credibility = scoreCredibility(place);
      const meters = distanceMeters(lat, lng, place.lat, place.lng);

      const credComponent = (credibility.score / 100) * VERDICT_MULTIPLIER[credibility.verdict];
      const distanceScore = 1 / (1 + meters / 1200); // 0m→1, 1.2km→0.5
      const openBusyScore = place.busyByHour[hour] ?? 0;

      const relevance =
        REL.credibility * credComponent +
        REL.distance * distanceScore +
        REL.openBusy * openBusyScore;

      return { place, credibility, distanceMeters: meters, relevance };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  return scored.map(({ place, credibility, distanceMeters: d }) => ({
    place,
    credibility,
    distanceMeters: d,
  }));
}

export interface PlaceByIdQuery {
  id: string;
  lat: number;
  lng: number;
}

/**
 * Fetch a single place by id, enriched with its verdict and distance from the
 * user. Returns null if unknown. Same shape the feed uses (ScoredPlace).
 */
export async function getPlaceById({ id, lat, lng }: PlaceByIdQuery): Promise<ScoredPlace | null> {
  if (DATA_MODE === "db") {
    const venues = await fetchVenues({ id, lat: String(lat), lng: String(lng) });
    const v = venues[0];
    if (!v) return null;
    const place = venueToPlace(v, v.app_category ?? "see");
    return { place, credibility: venueCredibility(v), distanceMeters: v.distance_m ?? 0 };
  }

  const places = await fetchAllPlaces(lat, lng);
  const place = places.find((p) => p.id === id);
  if (!place) return null;
  return {
    place,
    credibility: scoreCredibility(place),
    distanceMeters: distanceMeters(lat, lng, place.lat, place.lng),
  };
}

/**
 * A human area label for a coordinate, e.g. "Sukhumvit, Bangkok". v1 resolves
 * to the nearest known neighborhood; later this is real reverse geocoding.
 */
export async function getAreaLabel({ lat, lng }: { lat: number; lng: number }): Promise<string> {
  if (DATA_MODE === "db") {
    try {
      const res = await fetch(`/api/arealabel?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`);
      if (res.ok) {
        const { label } = (await res.json()) as { label: string | null };
        if (label) return label;
      }
    } catch { /* fall through to fallback */ }
    return "Bangkok";
  }
  const places = await fetchAllPlaces(lat, lng);
  let nearest: Place | null = null;
  let best = Infinity;
  for (const p of places) {
    const d = distanceMeters(lat, lng, p.lat, p.lng);
    if (d < best) {
      best = d;
      nearest = p;
    }
  }
  return nearest ? `${nearest.neighborhood}, Bangkok` : "Bangkok";
}

/** Look up saved places (by canonical id) with fresh verdicts, preserving order. */
export async function getSavedPlaces(
  ids: string[],
): Promise<{ place: Place; credibility: CredibilityResult }[]> {
  if (DATA_MODE === "db") {
    const found = await Promise.all(ids.map((id) => fetchVenues({ id })));
    return found
      .map((vs) => vs[0])
      .filter((v): v is NonNullable<typeof v> => Boolean(v))
      .map((v) => {
        const place = venueToPlace(v, v.app_category ?? "see");
        return { place, credibility: venueCredibility(v) };
      });
  }
  const places = await fetchAllPlaces(BANGKOK_CENTER.lat, BANGKOK_CENTER.lng);
  const byId = new Map(places.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Place => Boolean(p))
    .map((place) => ({ place, credibility: scoreCredibility(place) }));
}

/**
 * Result of pasting a link / name. Either we matched a place in our dataset
 * (and can show its verdict immediately — the magic moment), or we couldn't
 * and it's saved as unverified.
 */
export type ResolvedPaste =
  | { status: "matched"; place: Place; credibility: CredibilityResult }
  | { status: "unverified"; name: string; sourceUrl?: string };

// Generic venue words that shouldn't count as a distinctive name match.
const GENERIC_WORDS = new Set([
  "the", "restaurant", "bar", "club", "market", "cafe", "coffee", "house", "room",
  "grand", "street", "food", "shop", "store", "bangkok", "thailand", "and",
]);

const tokenize = (s: string): string[] => {
  let t = s;
  try {
    t = decodeURIComponent(s);
  } catch {
    /* leave as-is */
  }
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2 && !GENERIC_WORDS.has(w));
};

function labelForUrl(input: string): string {
  const s = input.toLowerCase();
  if (s.includes("instagram")) return "Instagram link";
  if (s.includes("tiktok")) return "TikTok link";
  if (s.includes("maps") || s.includes("goo.gl") || s.includes("google")) return "Maps link";
  return "Pasted link";
}

/**
 * v1 MOCK resolver: fuzzy-match pasted text/URL against our dataset by
 * distinctive name tokens. Real version would resolve the URL and geocode.
 */
export async function resolvePastedPlace(input: string): Promise<ResolvedPaste> {
  const trimmed = input.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  const inputTokens = new Set(tokenize(trimmed));

  // db mode: match against the REAL venue store via /api/venues?q= (same
  // ≥50%-of-name-tokens rule, applied server-side over 126k venues).
  if (DATA_MODE === "db") {
    const tokens = [...inputTokens];
    if (tokens.length) {
      const venues = await fetchVenues({
        q: tokens.join(" "),
        lat: String(BANGKOK_CENTER.lat),
        lng: String(BANGKOK_CENTER.lng),
        limit: "1",
      });
      const v = venues[0];
      if (v) {
        const place = venueToPlace(v, v.app_category ?? "see");
        return { status: "matched", place, credibility: venueCredibility(v) };
      }
    }
    const name = isUrl ? labelForUrl(trimmed) : trimmed.slice(0, 60) || "Saved place";
    return { status: "unverified", name, sourceUrl: isUrl ? trimmed : undefined };
  }

  const places = await fetchAllPlaces(BANGKOK_CENTER.lat, BANGKOK_CENTER.lng);
  let best: { place: Place; score: number } | null = null;
  for (const place of places) {
    const nameTokens = tokenize(place.name);
    if (nameTokens.length === 0) continue;
    const matched = nameTokens.filter((t) => inputTokens.has(t)).length;
    const score = matched / nameTokens.length;
    if (matched >= 1 && (!best || score > best.score)) best = { place, score };
  }

  if (best && best.score >= 0.5) {
    return { status: "matched", place: best.place, credibility: scoreCredibility(best.place) };
  }

  const name = isUrl ? labelForUrl(trimmed) : trimmed.slice(0, 60) || "Saved place";
  return { status: "unverified", name, sourceUrl: isUrl ? trimmed : undefined };
}

export interface EventsQuery {
  lat: number;
  lng: number;
}

/**
 * Events happening this week near a point, soonest first (distance breaks ties).
 */
export async function getEventsThisWeek({ lat, lng }: EventsQuery): Promise<Event[]> {
  // Region adapter: real Ticketmaster events where covered (UAE); everywhere
  // else the endpoint answers source:"curated" and we use the editorial layer.
  try {
    const res = await fetch(`/api/events?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const d = (await res.json()) as { source: string; events: Event[] | null };
      if (d.source === "ticketmaster" && d.events?.length) return d.events;
    }
  } catch { /* offline / error → curated fallback */ }
  return [...mockEvents].sort((a, b) => {
    const byDate = Date.parse(a.dateISO) - Date.parse(b.dateISO);
    if (byDate !== 0) return byDate;
    return distanceMeters(lat, lng, a.lat, a.lng) - distanceMeters(lat, lng, b.lat, b.lng);
  });
}
