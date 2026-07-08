import type {
  Category,
  Place,
  PlacePhoto,
  PlaceSourceRecord,
  Review,
  ReviewVelocityTrend,
  SourceName,
} from "../types";
import type { RawReview, RawSourceDetails } from "./types";
import { classifyLocalProbability, originFromProbability } from "./classify";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const DAY_MS = 86_400_000;

/** Convert a source-native rating onto the common 0–5 scale. */
export function normalizeRating(rating: number, scaleMax: number): number {
  if (scaleMax <= 0) return 0;
  return clamp((rating / scaleMax) * 5, 0, 5);
}

// Spread (in normalized stars) at which rating agreement hits zero. A 2.5-star
// gap across sources ⇒ they fundamentally disagree.
const AGREEMENT_RANGE = 2.5;

/** Rating-agreement sub-signal (0–1): tight spread across sources ⇒ high. */
export function agreementFromRatings(normalized: number[]): number {
  if (normalized.length < 2) return 1; // one source → no spread to measure
  const max = Math.max(...normalized);
  const min = Math.min(...normalized);
  return clamp(1 - (max - min) / AGREEMENT_RANGE, 0, 1);
}

/**
 * REAL cross-source agreement (0–1) — computed from the resolved multi-source
 * data, replacing the old pre-baked mock field. Combines:
 *   (a) rating agreement — low variance across sources' normalized ratings ⇒ high
 *       (`agreementFromRatings`); a place only one source rates highly scores low.
 *   (b) presence / corroboration — of the sources we consulted, how many actually
 *       have this place. All 3 found it ⇒ full corroboration; 1 of 3 ⇒ weak.
 * Formula: agreement = ratingAgreement × (matchedSources / consultedSources).
 * So strong rating disagreement OR thin corroboration both pull it down — and it
 * flows straight into scoreCredibility via the crossSource weight.
 */
export function computeCrossSourceAgreement(
  normalizedRatings: number[],
  consultedSources: number,
): number {
  const ratingAgreement = agreementFromRatings(normalizedRatings);
  const presence =
    consultedSources > 0 ? Math.min(1, normalizedRatings.length / consultedSources) : 1;
  return clamp(ratingAgreement * presence, 0, 1);
}

/** The resolved-place metadata mergeCluster needs (a ResolvedPlace satisfies this). */
export interface ResolvedMeta {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  /** Entity-resolution confidence (ResolvedPlace provides it; defaults to 1). */
  matchConfidence?: number;
}

/** Map a raw source review to our normalized Review, tagging its source. */
function toReview(r: RawReview, source: SourceName): Review {
  // Mock data ships a confident label; real reviews have none, so we fall back
  // to the FIRST-PASS heuristic classifier (the weakest link — see classify.ts).
  const localProbability = r.looksLocalOrTourist
    ? r.looksLocalOrTourist === "local"
      ? 1
      : 0
    : classifyLocalProbability(r);
  return {
    text: r.text,
    rating: r.rating,
    dateISO: r.dateISO,
    language: r.language,
    looksLocalOrTourist: originFromProbability(localProbability),
    localProbability,
    source,
  };
}

/** Dedup key for "obviously the same review": normalized text + date. */
const reviewKey = (r: RawReview) =>
  `${r.text.toLowerCase().replace(/[^a-z0-9]+/g, "")}|${r.dateISO}`;

/**
 * Merge every source's reviews into one corpus, tagged by source, with obvious
 * cross-source repeats removed (the same review often appears on >1 platform;
 * counting it twice would fake volume). Order follows source order (primary first).
 */
function mergeReviews(details: RawSourceDetails[]): Review[] {
  const seen = new Set<string>();
  const merged: Review[] = [];
  for (const d of details) {
    for (const r of d.reviews) {
      const key = reviewKey(r);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(toReview(r, d.sourceName));
    }
  }
  return merged;
}

// ── real-mode derivation fallbacks (unused while mock provides the fields) ────
/** Reviews within 90 days of the newest review. Rough proxy for volume-recency. */
function deriveRecentCount(reviews: Review[]): number {
  if (!reviews.length) return 0;
  const newest = Math.max(...reviews.map((r) => Date.parse(r.dateISO)));
  const cutoff = newest - 90 * DAY_MS;
  return reviews.filter((r) => Date.parse(r.dateISO) >= cutoff).length;
}
/** Compare recent-half vs older-half review counts to guess a trend. */
function deriveVelocity(reviews: Review[]): ReviewVelocityTrend {
  if (reviews.length < 4) return "steady";
  const sorted = [...reviews].sort((a, b) => Date.parse(a.dateISO) - Date.parse(b.dateISO));
  const mid = Math.floor(sorted.length / 2);
  const older = mid;
  const recent = sorted.length - mid;
  if (recent > older) return "rising";
  if (recent < older) return "falling";
  return "steady";
}

/**
 * Merge every source's detail record for ONE resolved place into the single
 * normalized `Place` the engine + UI consume. This is where cross-source
 * corroboration happens (rating averaging + agreement).
 */
export function mergeCluster(
  resolved: ResolvedMeta,
  details: RawSourceDetails[],
  consultedSources: number,
): Place {
  // The primary (google) record carries the descriptive/derived fields.
  const primary = details.find((d) => d.sourceName === "google") ?? details[0];

  const normalized = details.map((d) => d.ratingNormalized);
  // Cross-source average rating, rounded to 1 dp (how ratings are shown anyway).
  const rawRating = Math.round((normalized.reduce((a, b) => a + b, 0) / normalized.length) * 10) / 10;

  // REAL cross-source agreement, computed from the merged sources (see fn docs).
  const crossSourceAgreement = computeCrossSourceAgreement(normalized, consultedSources);

  // Merged, source-tagged, de-duplicated review corpus fed to the engine.
  const reviews = mergeReviews(details);

  // Photos: primary source first, then the rest; dedupe by URL; cap at 6.
  const photos: PlacePhoto[] = [];
  const seenUrls = new Set<string>();
  for (const d of [primary, ...details.filter((d) => d !== primary)]) {
    for (const ph of d.photos) {
      if (photos.length >= 6 || seenUrls.has(ph.url)) continue;
      seenUrls.add(ph.url);
      photos.push({ url: ph.url, attribution: ph.attribution, source: d.sourceName });
    }
  }

  return {
    id: resolved.id,
    name: resolved.name,
    category: resolved.category,
    lat: resolved.lat,
    lng: resolved.lng,
    neighborhood: primary.neighborhood ?? "",
    priceLevel: primary.priceLevel ?? 2,
    homeCurrencyEstimate: primary.homeCurrencyEstimate ?? "",
    rawRating,
    reviewCount: primary.reviewCount, // real mode may sum/dedupe across sources
    reviews,
    recentReviewCount90d: primary.recentReviewCount90d ?? deriveRecentCount(reviews),
    reviewVelocityTrend: primary.reviewVelocityTrend ?? deriveVelocity(reviews),
    busyByHour: primary.popularByHour ?? new Array(24).fill(0),
    crossSourceAgreement,
    photos,
    // Trust receipts: each source's read, in its own native terms.
    sources: details.map(
      (d): PlaceSourceRecord => ({
        source: d.sourceName,
        rating: d.rating,
        ratingScaleMax: d.ratingScaleMax,
        reviewCount: d.reviewCount,
      }),
    ),
    matchConfidence: resolved.matchConfidence ?? 1,
  };
}
