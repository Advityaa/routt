import type { RawSourcePlace } from "../sources/types";

/**
 * Entity-resolution matching primitives.
 *
 * Merging two source records means "these are the SAME real place, cross-check
 * them." A WRONG merge shows a user reviews for the wrong restaurant and destroys
 * the trust we sell — so every rule here is deliberately conservative: when in
 * doubt, DO NOT merge. A missed match only costs us some cross-checking.
 */

// ── thresholds (tune here; each documented) ──────────────────────────────────
/**
 * Max distance between two source records of the SAME place. Cross-provider
 * GPS/geocoding jitter is typically <50m; 75m adds margin without spanning
 * neighbouring venues in dense areas. Beyond this we NEVER merge, whatever the
 * names say.
 */
export const MATCH_RADIUS_M = 75;
/**
 * Minimum normalized name similarity (0–1, token-set ratio) required to merge.
 * Two different venues can share a building/mall/food-court address, so
 * proximity alone is not enough — the names must also agree. 0.72 tolerates word
 * order, an extra descriptor, and minor spelling/romanization drift, while still
 * rejecting genuinely different names.
 */
export const NAME_SIM_FLOOR = 0.72;
/** A "strong" match (very close + near-identical name) — boosts confidence. */
export const STRONG_RADIUS_M = 30;
export const STRONG_NAME_SIM = 0.9;

const R_EARTH = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in meters between two coordinates. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Generic words that don't distinguish a venue — stripped before comparison.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "of", "at", "de", "la", "le",
  "restaurant", "cafe", "coffee", "bar", "pub", "bistro", "eatery", "kitchen",
  "shop", "store", "market", "mall", "hall", "house", "room", "club", "lounge",
  "grand", "royal", "thai", "bangkok", "co", "ltd", "company",
]);

/**
 * Normalize a name into distinctive tokens: strip accents, lowercase, drop
 * punctuation, and remove generic words. NOTE: characters outside [a-z0-9] are
 * dropped, so cross-SCRIPT matching (e.g. Thai ↔ Latin romanization) is NOT
 * handled here — that needs transliteration and is a known, deliberate gap
 * (leaving such records unmerged is the safe failure).
 */
export function normalizeName(name: string): string[] {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const tokens = base.split(" ").filter(Boolean);
  const distinctive = tokens.filter((t) => !STOPWORDS.has(t));
  // If a name is entirely generic (e.g. "The Room"), keep the raw tokens rather
  // than collapse to nothing.
  return distinctive.length ? distinctive : tokens;
}

// ── string similarity: token-set ratio (fuzzywuzzy-style) ────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let diag = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        diag + (a[i - 1] === b[j - 1] ? 0 : 1), // substitution
      );
      diag = tmp;
    }
  }
  return row[n];
}

/** Normalized edit-distance similarity, 0–1 (1 = identical). */
function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

/**
 * Token-set ratio on normalized names (0–1). Robust to word order, an extra
 * descriptor ("Jok Prince" vs "Jok Prince Congee"), and minor spelling drift.
 */
export function nameSimilarity(nameA: string, nameB: string): number {
  const a = normalizeName(nameA);
  const b = normalizeName(nameB);
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter((x) => setB.has(x)).sort();
  const onlyA = [...setA].filter((x) => !setB.has(x)).sort();
  const onlyB = [...setB].filter((x) => !setA.has(x)).sort();
  const s0 = inter.join(" ");
  const s1 = [...inter, ...onlyA].join(" ").trim();
  const s2 = [...inter, ...onlyB].join(" ").trim();
  return Math.max(ratio(s0, s1), ratio(s0, s2), ratio(s1, s2));
}

/** Do two source records refer to the same real place? Requires BOTH signals. */
export function isSamePlace(a: RawSourcePlace, b: RawSourcePlace): boolean {
  return (
    distanceMeters(a, b) <= MATCH_RADIUS_M &&
    nameSimilarity(a.name, b.name) >= NAME_SIM_FLOOR
  );
}
