/**
 * Routt v1 — domain type definitions.
 *
 * Shapes mirror what we'd realistically have after normalizing Google Places
 * Details + Foursquare Places (for `Place`) and Songkick (for `Event`). The
 * credibility engine's output (`CredibilityResult`) is OUR value-add computed on
 * top of this raw data — it never comes from an upstream API.
 *
 * Principle: ONE ENGINE, MANY CATEGORIES. Eat/Drink/Shop/See are just tags on
 * the same ranked feed — never separate per-category models.
 */

/** The four category tags on the single ranked feed. */
export type Category = "eat" | "drink" | "shop" | "see";

/**
 * The signature output. Every place card leads with this, never a star average.
 * "unrated" = not enough reviews to judge honestly yet (thin data), rendered as
 * a neutral badge — never green/amber/red.
 */
export type CredibilityVerdict = "still-good" | "fading" | "tourist-trap" | "unrated" | "mixed"; // "mixed" comes ONLY from first-party UGC rollups, never the engine

/** Coarse time-of-day bucket used to pick the default category + ordering. */
export type TimeOfDay = "morning" | "lunch" | "afternoon" | "evening" | "night";

/** Direction of a place's recent review volume. */
export type ReviewVelocityTrend = "rising" | "steady" | "falling";

/** Whether a single review reads like a local or a visitor. */
export type ReviewOrigin = "local" | "tourist";

/** The data sources we cross-check across. */
export type SourceName = "google" | "foursquare" | "reddit";

/**
 * A sampled review. In production this is a representative sample pulled from
 * the review sources — enough to characterize recency, sentiment trajectory,
 * and the local/tourist mix that the credibility engine keys on.
 */
export interface Review {
  text: string;
  rating: number; // 1–5
  dateISO: string; // ISO 8601, e.g. "2026-06-19"
  language: string; // BCP-47-ish, e.g. "th", "en"
  looksLocalOrTourist: ReviewOrigin;
  source?: SourceName; // which source contributed this review (set at merge time)
  /**
   * P(reviewer is a local), 0–1. Mock data is confident (0/1). Real reviews are
   * scored by a FIRST-PASS heuristic (see lib/sources/classify.ts) — the weakest
   * link in the whole engine. `looksLocalOrTourist` is this thresholded at 0.5.
   */
  localProbability?: number;
}

/**
 * A photo of a place, ready to render. `url` is either same-origin (mock asset
 * or our /api/photo proxy — keys stay server-side) or a public CDN URL (fsq).
 * `attribution` is displayed per the source's terms (Google html_attributions,
 * CC author/license for mock assets).
 */
export interface PlacePhoto {
  url: string;
  attribution?: string;
  source: SourceName;
}

/**
 * Per-source receipt for the trust display: what each source said about this
 * place, in that source's native terms. Kept raw (native scale) so the UI can
 * show honest numbers — "8.8/10 on Foursquare", "14 mentions on Reddit".
 */
export interface PlaceSourceRecord {
  source: SourceName;
  rating: number; // native scale
  ratingScaleMax: 1 | 5 | 10;
  reviewCount: number; // reviews / ratings / mentions, per source semantics
}

/**
 * A place, normalized across sources. Fields chosen to be a realistic merge of
 * what Google Places Details + Foursquare give us.
 */
export interface Place {
  id: string;
  name: string;
  /** Local-script name (e.g. Thai) — show as a subtitle; handy for taxi drivers. */
  nameLocal?: string;
  category: Category;
  lat: number;
  lng: number;
  neighborhood: string;

  priceLevel: 1 | 2 | 3 | 4;
  homeCurrencyEstimate: string; // e.g. "~$4 / dish"

  rawRating: number; // 0–5 aggregate average
  reviewCount: number; // total across sources

  reviews: Review[]; // representative sample used for scoring

  recentReviewCount90d: number; // volume in the trailing 90 days
  reviewVelocityTrend: ReviewVelocityTrend;

  busyByHour: number[]; // length 24, relative busyness 0–1 per local hour
  crossSourceAgreement: number; // 0–1: how much the sources agree on rating
  /** Attached by the merge pipeline; absent in the authored mock dataset. May be
   *  empty — unrated/low-data places often legitimately have no photo. */
  photos?: PlacePhoto[];
  /** Trust receipts: what each source reported (attached by the merge pipeline). */
  sources?: PlaceSourceRecord[];
  /** Entity-resolution confidence that the merged sources are the SAME place
   *  (0–1, from lib/resolve). 1 source → no cross-check to be confident about. */
  matchConfidence?: number;
}

/** Type of an event, roughly Songkick-style categorization. */
export type EventType =
  | "music"
  | "market"
  | "art"
  | "food"
  | "sport"
  | "nightlife"
  | "culture";

/** An event this week near the user. Shape mirrors Songkick. */
export interface Event {
  id: string;
  name: string;
  type: EventType;
  venue: string;
  lat: number;
  lng: number;
  dateISO: string; // ISO 8601 with time, e.g. "2026-07-02T20:00:00+07:00"
  ticketUrl: string;
}

/**
 * Output of the credibility engine. Defined here (not in credibility.ts) so
 * both the engine and consumers can import it without a circular dependency.
 */
export interface CredibilityResult {
  verdict: CredibilityVerdict;
  score: number; // 0–100 overall credibility/health (still computed when unrated)
  reasons: string[]; // 1–3 short, human-readable strings shown under the badge
  lowConfidence: boolean; // true when there's too little data to trust the verdict
}

/**
 * A place enriched by the data provider: raw place + our credibility verdict +
 * computed distance. This is what the UI consumes so it never re-derives data.
 */
export interface ScoredPlace {
  place: Place;
  credibility: CredibilityResult;
  distanceMeters: number;
}
