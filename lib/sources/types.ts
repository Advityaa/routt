import type { Category, ReviewOrigin, ReviewVelocityTrend, SourceName } from "../types";

export type { SourceName };

/**
 * Routt source-adapter contract.
 *
 * Every data source (Google Places, Foursquare, Reddit, …) implements the SAME
 * `PlaceSource` interface and returns the SAME raw shapes. The rest of the app
 * never imports a source directly — it goes through lib/dataProvider.ts, which
 * orchestrates: sources → resolve/merge → score → `Place`. Adding or removing a
 * source is a one-line change in lib/sources/index.ts.
 *
 * ── Rating normalization ─────────────────────────────────────────────────────
 * Sources rate on different scales. We keep each source's NATIVE value plus a
 * `ratingNormalized` on a common 0–5 scale, converted linearly:
 *     normalized = clamp(rating / ratingScaleMax * 5, 0, 5)
 *   • Google     0–5  (scaleMax 5  → unchanged)
 *   • Foursquare 0–10 (scaleMax 10 → ÷2)
 *   • Reddit     0–1  sentiment (scaleMax 1 → ×5)
 * The merge step averages the normalized values and derives cross-source
 * agreement from their spread — that agreement IS our core trust signal.
 */

/** A photo as a source hands it over: a renderable URL (same-origin proxy/asset
 *  or public CDN — never a keyed provider URL) plus required attribution text. */
export interface RawPhoto {
  url: string;
  attribution?: string;
}

/** A review exactly as a SOURCE returns it (pre-normalization). */
export interface RawReview {
  text: string;
  rating: number; // source-native scale
  dateISO: string;
  language: string; // BCP-47-ish, e.g. "th", "en"
  authorId?: string; // used by the local/tourist classifier in real mode
  /**
   * MOCK ONLY. The pre-authored local/tourist label. In real mode a source does
   * NOT hand us this — the normalizer's classifier must infer it (the single
   * hardest ML problem; see the LOAD-BEARING ASSUMPTION banner in credibility.ts).
   */
  looksLocalOrTourist?: ReviewOrigin;
}

/** A place as it appears in a source's nearby-search result (lightweight). */
export interface RawSourcePlace {
  sourceName: SourceName;
  sourceId: string; // the id WITHIN that source (namespaces differ per source)
  name: string;
  lat: number;
  lng: number;
  category: Category;
  rating: number; // source-native scale
  ratingScaleMax: 1 | 5 | 10;
  reviewCount: number;
}

/** Full detail payload a source returns for one place. */
export interface RawSourceDetails {
  sourceName: SourceName;
  sourceId: string;
  name: string;

  rating: number; // source-native scale
  ratingScaleMax: 1 | 5 | 10;
  ratingNormalized: number; // 0–5 (see header)

  reviewCount: number;
  reviews: RawReview[];
  photos: RawPhoto[];

  // Optionally provided by some sources:
  //  • Google: price_level → priceLevel, popular_times → popularByHour,
  //    address components → neighborhood
  //  • Foursquare: price, categories
  priceLevel?: 1 | 2 | 3 | 4;
  neighborhood?: string;
  popularByHour?: number[]; // length 24, 0–1

  /**
   * Fields DERIVED downstream in real mode (from review timestamps / rating-count
   * snapshots) but provided directly in MOCK so the pipeline reproduces legacy
   * behavior byte-for-byte. The normalizer prefers these when present, else
   * derives them. See lib/sources/normalize.ts.
   */
  recentReviewCount90d?: number;
  reviewVelocityTrend?: ReviewVelocityTrend;
  homeCurrencyEstimate?: string;
}

/** The pluggable source contract. */
export interface PlaceSource {
  readonly name: SourceName;
  searchNearby(category: Category, lat: number, lng: number): Promise<RawSourcePlace[]>;
  getDetails(sourcePlaceId: string): Promise<RawSourceDetails>;
}
