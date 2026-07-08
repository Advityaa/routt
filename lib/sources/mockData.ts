import type { Category, Place, SourceName } from "../types";
import { mockPlaces } from "../mock";
import type { RawReview, RawSourceDetails, RawSourcePlace } from "./types";
import { mockPhotosFor } from "./mockPhotos";

/**
 * Reshapes the existing mock `Place[]` into per-source raw records so the whole
 * multi-source pipeline runs on mock data today.
 *
 * Cross-source ratings now DIFFER realistically: each place's (formerly baked)
 * `crossSourceAgreement` is repurposed as a design knob — it sets how far apart
 * the sources' ratings sit around the true rating. So `crossSourceAgreement` is
 * no longer read by the engine; it only shapes the mock source data, and the
 * pipeline RE-COMPUTES agreement from that data (see normalize.computeCross...).
 * Offsets are symmetric (google a touch high, reddit/locals a touch low), so the
 * merged average ≈ the original rating and verdicts stay stable.
 *
 * Reviews: google is the rich/primary source (full corpus); foursquare + reddit
 * echo a couple of the same reviews, so the merge step's cross-source
 * de-duplication is actually exercised.
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const SCALE: Record<SourceName, 1 | 5 | 10> = { google: 5, foursquare: 10, reddit: 1 };

// Must match AGREEMENT_RANGE in normalize.ts so computed agreement ≈ the knob.
const SPREAD_RANGE = 2.5;

/** Per-source offset (in 0–5 stars) from the true rating, set by the agreement knob. */
function ratingOffset(source: SourceName, agreement: number): number {
  const spread = (1 - agreement) * SPREAD_RANGE; // total gap across sources
  if (source === "google") return spread / 2; // primary reads a touch high…
  if (source === "reddit") return -spread / 2; // …locals (reddit) a touch low
  return 0; // foursquare ~ the middle
}

/** This source's rating for a place, on the common 0–5 scale. */
function sourceRating0to5(source: SourceName, p: Place): number {
  return clamp(p.rawRating + ratingOffset(source, p.crossSourceAgreement), 0, 5);
}

/** Convert a 0–5 rating to a source's native scale. */
function toNative(source: SourceName, rating0to5: number): number {
  if (source === "google") return rating0to5; // 0–5
  if (source === "foursquare") return rating0to5 * 2; // 0–10
  return rating0to5 / 5; // reddit sentiment 0–1
}

/** Realistic per-source volume: Google carries the big review base, Foursquare a
 *  fraction as ratings/tips, Reddit a handful of thread mentions. */
function sourceCount(source: SourceName, googleCount: number): number {
  if (source === "google") return googleCount;
  if (source === "foursquare") return Math.max(5, Math.round(googleCount / 8));
  return Math.max(2, Math.round(googleCount / 150)); // reddit mentions
}

/** Per-source id namespaces (real sources have distinct id spaces). */
function sourceIdFor(source: SourceName, placeId: string): string {
  if (source === "google") return placeId; // canonical id inherits from google
  if (source === "foursquare") return `fsq_${placeId}`;
  return `rdt_${placeId}`;
}
function placeIdFrom(source: SourceName, sourceId: string): string {
  if (source === "google") return sourceId;
  return sourceId.replace(/^(fsq|rdt)_/, "");
}

function rawReviewsFor(p: Place): RawReview[] {
  return p.reviews.map((r) => ({
    text: r.text,
    rating: r.rating,
    dateISO: r.dateISO,
    language: r.language,
    looksLocalOrTourist: r.looksLocalOrTourist, // mock passthrough (real: classifier)
  }));
}

export function mockSearchNearby(source: SourceName, category: Category): RawSourcePlace[] {
  return mockPlaces
    .filter((p) => p.category === category)
    .map((p) => ({
      sourceName: source,
      sourceId: sourceIdFor(source, p.id),
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      rating: toNative(source, sourceRating0to5(source, p)),
      ratingScaleMax: SCALE[source],
      reviewCount: sourceCount(source, p.reviewCount),
    }));
}

export function mockGetDetails(source: SourceName, sourceId: string): RawSourceDetails {
  const id = placeIdFrom(source, sourceId);
  const p = mockPlaces.find((x) => x.id === id);
  if (!p) throw new Error(`[${source}] unknown place id: ${sourceId}`);

  const rating0to5 = sourceRating0to5(source, p);
  const base: RawSourceDetails = {
    sourceName: source,
    sourceId,
    name: p.name,
    rating: toNative(source, rating0to5),
    ratingScaleMax: SCALE[source],
    ratingNormalized: rating0to5,
    reviewCount: sourceCount(source, p.reviewCount),
    reviews: [],
    photos: [],
  };

  if (source === "google") {
    // Primary/rich source: full canonical record + full review corpus.
    return {
      ...base,
      reviews: rawReviewsFor(p),
      photos: mockPhotosFor(p.id),
      priceLevel: p.priceLevel,
      neighborhood: p.neighborhood,
      popularByHour: p.busyByHour,
      recentReviewCount90d: p.recentReviewCount90d,
      reviewVelocityTrend: p.reviewVelocityTrend,
      homeCurrencyEstimate: p.homeCurrencyEstimate,
    };
  }

  // Foursquare / Reddit corroborate the rating and echo a couple of the same
  // reviews (so the merge step de-duplicates cross-source repeats).
  const echoes = rawReviewsFor(p);
  return {
    ...base,
    reviews: source === "foursquare" ? echoes.slice(0, 2) : echoes.slice(-2),
  };
}
