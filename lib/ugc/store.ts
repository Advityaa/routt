import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { VenueRow } from "../venues/store";

/**
 * FIRST-PARTY UGC store + rollup — Routt's owned traveler signal (the moat).
 *
 * Rules (see spec): never store external review data (Google/FSQ terms forbid
 * it); verdicts assert ONLY from these real first-party rows, never seeded;
 * photos/tips hidden until moderated; kept separate from the licensed venue
 * skeleton (license hygiene). v1 persists to data/ugc/reviews.json mirroring
 * db/schema.sql `venue_reviews` — Postgres swap changes only this file.
 */

export type QuickVerdict = "still-good" | "not-what-it-was" | "closed";
export type VerdictState = "not-rated" | "early" | "still-good" | "mixed" | "fading";

export interface VenueReview {
  id: string;
  gers_id: string;
  user_id: string;
  handle: string | null; // first name / handle only (privacy)
  quick: QuickVerdict | null;
  rating: number | null; // 1–5
  text: string | null;
  is_local: boolean;
  price_paid: number | null;
  photo_url: string | null; // our storage only; hidden until moderated
  moderated: boolean;
  reported: boolean;
  created_at: string;
}

export interface RolledSignals {
  verdict_state: VerdictState;
  review_count_90d: number;
  local_count_90d: number;
  local_pct: number | null;
  avg_rating: number | null; // recency-weighted
  fairness_low: number | null;
  fairness_high: number | null;
  last_computed: string;
}

// ── thresholds (documented; tune with volume) ────────────────────────────────
const MIN_REPORTS_FOR_VERDICT = 5; // 90d reports needed before we assert anything
const DECAY_HALFLIFE_DAYS = 60; // recency weight: half-life of a signal
const STILL_GOOD_MIN_AVG = 3.8; // weighted avg at/above → healthy
const FADING_MAX_AVG = 3.0; // weighted avg at/below → declining
const DAY_MS = 86_400_000;

const FILE = join(process.cwd(), "data/ugc/reviews.json");

function readAll(): VenueReview[] {
  try {
    return existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")).reviews ?? []) : [];
  } catch {
    return [];
  }
}
function writeAll(reviews: VenueReview[]) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify({ _comment: "First-party venue_reviews (real, never seeded). See db/schema.sql.", reviews }, null, 1));
}

// ── anti-abuse (cheap v1) ────────────────────────────────────────────────────
const PROFANITY = /\b(fuck|shit|bitch|cunt|asshole|dickhead)\b/i;
const MAX_PER_VENUE_PER_DAY = 1; // one report per venue per user per day
const MAX_PER_USER_PER_HOUR = 6; // global submit cap

export type SubmitResult = { ok: true; review: VenueReview } | { ok: false; error: string };

export function submitReview(input: {
  gers_id: string;
  user_id: string;
  handle?: string;
  quick?: QuickVerdict;
  rating?: number;
  text?: string;
  is_local: boolean;
  price_paid?: number;
  photo_url?: string;
}): SubmitResult {
  if (!input.gers_id || !input.user_id) return { ok: false, error: "missing ids" };
  if (!input.quick && !input.rating && !input.text && input.price_paid == null)
    return { ok: false, error: "empty contribution" };
  if (input.rating != null && (input.rating < 1 || input.rating > 5))
    return { ok: false, error: "rating out of range" };
  if (input.text && input.text.length > 400) return { ok: false, error: "tip too long" };
  if (input.text && PROFANITY.test(input.text)) return { ok: false, error: "tip rejected by content filter" };

  const all = readAll();
  const now = Date.now();
  const mine = all.filter((r) => r.user_id === input.user_id);
  if (mine.filter((r) => now - Date.parse(r.created_at) < DAY_MS && r.gers_id === input.gers_id).length >= MAX_PER_VENUE_PER_DAY)
    return { ok: false, error: "already reported this place today" };
  if (mine.filter((r) => now - Date.parse(r.created_at) < 3_600_000).length >= MAX_PER_USER_PER_HOUR)
    return { ok: false, error: "rate limit — try again later" };

  const review: VenueReview = {
    id: `rev-${now}-${Math.random().toString(36).slice(2, 8)}`,
    gers_id: input.gers_id,
    user_id: input.user_id,
    handle: input.handle?.trim().slice(0, 24) || null,
    quick: input.quick ?? null,
    rating: input.rating ?? null,
    text: input.text?.trim().slice(0, 400) || null,
    is_local: Boolean(input.is_local),
    price_paid: input.price_paid ?? null,
    photo_url: input.photo_url ?? null,
    moderated: false, // photos + tips queue for moderation before public display
    reported: false,
    created_at: new Date(now).toISOString(),
  };
  all.push(review);
  writeAll(all);
  return { ok: true, review };
}

export function reportReview(reviewId: string): boolean {
  const all = readAll();
  const r = all.find((x) => x.id === reviewId);
  if (!r) return false;
  r.reported = true;
  writeAll(all);
  return true;
}

// ── rollup: venue_reviews → venue_signals (recency-weighted, pure) ──────────
export function rollupSignals(gersId: string, reviews = readAll(), now = new Date()): RolledSignals {
  const nowMs = now.getTime();
  const mine = reviews.filter(
    (r) => r.gers_id === gersId && !r.reported && nowMs - Date.parse(r.created_at) <= 90 * DAY_MS,
  );
  const weight = (r: VenueReview) =>
    Math.pow(0.5, (nowMs - Date.parse(r.created_at)) / (DECAY_HALFLIFE_DAYS * DAY_MS));

  const rated = mine.filter((r) => r.rating != null);
  const wSum = rated.reduce((s, r) => s + weight(r), 0);
  const avg = wSum > 0 ? rated.reduce((s, r) => s + weight(r) * r.rating!, 0) / wSum : null;

  // Quick taps count as sentiment too: still-good ≈ 4.5★, not-what-it-was ≈ 2.5★,
  // closed ≈ 1★ — folded into the same weighted average.
  const QUICK_STARS: Record<QuickVerdict, number> = { "still-good": 4.5, "not-what-it-was": 2.5, closed: 1 };
  const quicks = mine.filter((r) => r.quick && r.rating == null);
  const qw = quicks.reduce((s, r) => s + weight(r), 0);
  const blended =
    wSum + qw > 0
      ? ((avg ?? 0) * wSum + quicks.reduce((s, r) => s + weight(r) * QUICK_STARS[r.quick!], 0)) / (wSum + qw)
      : null;

  const locals = mine.filter((r) => r.is_local).length;
  const prices = mine.map((r) => r.price_paid).filter((p): p is number => p != null).sort((a, b) => a - b);

  let verdict_state: VerdictState;
  if (mine.length === 0) verdict_state = "not-rated";
  else if (mine.length < MIN_REPORTS_FOR_VERDICT) verdict_state = "early";
  else if (blended != null && blended >= STILL_GOOD_MIN_AVG) verdict_state = "still-good";
  else if (blended != null && blended <= FADING_MAX_AVG) verdict_state = "fading";
  else verdict_state = "mixed";

  return {
    verdict_state,
    review_count_90d: mine.length,
    local_count_90d: locals,
    local_pct: mine.length ? Math.round((locals / mine.length) * 100) : null,
    avg_rating: blended != null ? Math.round(blended * 10) / 10 : null,
    fairness_low: prices.length >= 3 ? prices[Math.floor(prices.length * 0.25)] : null,
    fairness_high: prices.length >= 3 ? prices[Math.floor(prices.length * 0.75)] : null,
    last_computed: now.toISOString(),
  };
}

/** Publicly displayable tips: moderated, non-reported, newest first. */
export function publicTips(gersId: string, limit = 5) {
  return readAll()
    .filter((r) => r.gers_id === gersId && r.text && r.moderated && !r.reported)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, limit)
    .map((r) => ({ id: r.id, text: r.text, handle: r.handle ?? "Traveller", is_local: r.is_local, created_at: r.created_at }));
}

// ── legal listing-quality hint (NOT a verdict) ───────────────────────────────
/**
 * Derived ONLY from data we may store (Overture confidence + completeness).
 * Clearly labelled listing metadata — never phrased as a credibility verdict.
 */
export function listingQuality(v: Pick<VenueRow, "confidence" | "address" | "phone" | "website">): "established" | "limited" {
  const completeness = [v.address, v.phone, v.website].filter(Boolean).length;
  return (v.confidence ?? 0) >= 0.75 && completeness >= 2 ? "established" : "limited";
}

/** All reviews (for batch rollups — read the file once, roll up many). */
export function allReviews(): VenueReview[] {
  return readAll();
}
