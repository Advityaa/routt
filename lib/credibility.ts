import type {
  Place,
  Review,
  CredibilityResult,
  CredibilityVerdict,
} from "./types";

/**
 * Routt credibility engine.
 *
 * scoreCredibility(place, referenceDate = new Date()) -> { verdict, score, reasons }
 *
 * This is the signature feature, so the logic is rule-based and explainable:
 * every verdict can be traced to concrete signals, and those same signals
 * produce the human-readable `reasons` shown under the badge.
 *
 * Credibility is inherently TIME-RELATIVE — the whole product promise is telling
 * a currently-thriving place from a historically-popular-but-now-dead one. So
 * "recent vs older" is split by ACTUAL DATE relative to `referenceDate`, not by
 * array position. `referenceDate` is an explicit input (defaults to now) so the
 * function stays PURE and DETERMINISTIC given its inputs, and tests inject a
 * fixed date rather than depending on the wall clock.
 *
 * ── Signals ────────────────────────────────────────────────────────────────
 *  1. RECENCY   — recent review volume (recentReviewCount90d). Lots = alive; none = dying.
 *  2. VELOCITY  — direction of that volume. rising/steady = healthy; falling = fading.
 *  3. LOCAL MIX — locals-go is Routt's whole thesis. High tourist share + high
 *                 rating is the classic tourist-trap fingerprint.
 *  4. TRAJECTORY— rating DIRECTION over time (recent-window avg vs older baseline).
 *  5. CROSS-SRC — do the sources agree? Low agreement = a hyped/gamed rating.
 */

/* ============================================================================
 * ⚠️  LOAD-BEARING ASSUMPTION — local-vs-tourist classification
 * ----------------------------------------------------------------------------
 * ALL tourist-trap detection ultimately rests on `review.looksLocalOrTourist`.
 * This engine TREATS THAT FIELD AS TRUSTED INPUT. In the mock dataset we author
 * it by hand; in production it is the single hardest ML problem in the whole
 * product — inferring whether a reviewer is a local or a visitor from language,
 * account history, home geo, review cadence, etc.
 *
 * Things to keep front of mind:
 *  • It will NOT be a clean boolean. Real classification is PROBABILISTIC
 *    (a per-review confidence), frequently wrong on any single reviewer and
 *    only trustworthy in aggregate.
 *  • Trap verdicts are only as good as this signal. A systematic bias here
 *    (e.g. treating every non-English review as "local") would silently poison
 *    every trap call while the rest of the engine looks fine.
 *  • PLANNED DIRECTION: trap-detection confidence should eventually SCALE with
 *    classification confidence. A place whose local/tourist split is built from
 *    low-confidence guesses should lean toward "unrated" rather than a
 *    confident trap/still-good. The intended shape is a per-review
 *    `localProbability` (0–1) feeding a probability-weighted `localShare()`
 *    plus a place-level classification-confidence term. See the README
 *    ("credibility engine") for the migration note; the proposal is NOT yet
 *    implemented — everything below assumes the trusted boolean.
 *
 * When this field stops being authored by hand, VALIDATE IT FIRST.
 * ==========================================================================*/

// ── Tunable weights (sum to 1.0) ─────────────────────────────────────────────
// Recency leads: an "alive right now" signal is the strongest evidence a place
// is still worth it. Velocity and local-mix tie for second — they encode the
// two ways a place goes bad (it dies, or it gets captured by tourists).
// Trajectory and cross-source are corroborating, so they weigh least.
const W = {
  recency: 0.28,
  velocity: 0.22,
  local: 0.22,
  trajectory: 0.14,
  crossSource: 0.14,
} as const;

// ── Thresholds (documented where used) ───────────────────────────────────────
const DAY_MS = 86_400_000;
// A review counts as "recent" if it lands within this window of referenceDate.
// 180d is wide enough to almost always yield a baseline to compare against,
// while still being anchored to real time. (Volume recency uses the tighter
// recentReviewCount90d field — both mean "recent, anchored to actual dates".)
const RECENT_WINDOW_DAYS = 180;

const RECENCY_SATURATION = 25; // recent-90d reviews at which "alive" maxes out
const VELOCITY_SCORE = { rising: 1.0, steady: 0.7, falling: 0.15 } as const;

const TRAP_MIN_RATING = 4.3; // trap must look great on paper
// Arm 1 — "becoming a trap" (a place sliding into one).
const TRAP_MIN_TOURIST_RATIO = 0.65; // ...tourist-dominated
const TRAP_LOCAL_DROP = -0.12; // ...with local share falling recent-vs-older
const TRAP_MAX_RECENT_LOCAL = 0.3; // ...or almost no locals left recently
// Arm 2 — "sustained / born-a-trap" (always been touristy; no decline needed).
// Higher tourist bar since we're NOT requiring a fall-off, so we don't sweep in
// merely-popular spots. "Recent locals a minority" guards against a place that
// is genuinely turning local.
const TRAP_SUSTAINED_TOURIST_RATIO = 0.8; // persistently this tourist-heavy overall
const TRAP_SUSTAINED_MAX_RECENT_LOCAL = 0.5; // locals still not the majority now

// Fading thresholds. Fading steers a user AWAY, so it demands real evidence:
// ONE STRONG signal, or TWO MILD ones (see assessFading). A single weak wobble —
// a quiet quarter, a dip that's still excellent — must NOT fade a good place.
const RECENT_DRIED = 5; // < this many recent reviews → effectively dead now (STRONG)
const RECENT_LOW = 13; // < this → modestly low recent volume (MILD; STRONG w/ falling velocity)
const TRAJ_STEEP = -0.6; // rating sliding this steeply → STRONG (only once out of "excellent")
const TRAJ_MILD = -0.25; // rating easing this much → MILD
const LOCAL_SOFTENING_DELTA = -0.15; // recent-vs-older local share dropped this much...
const LOCAL_MINORITY = 0.5; // ...AND locals are now a minority (guards healthy local-majority dips)
const HEALTHY_RATING_FLOOR = 4.3; // a dip that stays >= this is still excellent, not decline

const STILL_GOOD_MIN_SCORE = 50; // floor to earn a "still good" verdict (catch-all fade below)

// Confidence gates — don't give a confident verdict on thin data.
const MIN_REVIEWS_FOR_VERDICT = 8; // below this total volume → "unrated"
const MIN_RECENT_FOR_TRAJECTORY = 4; // fewer recent-window reviews → trajectory
// is unreliable (one grumpy review swings it), so we treat it as neutral

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number) => Math.round(x * 100);
const localShare = (rs: Review[]) =>
  rs.length ? rs.filter((r) => r.looksLocalOrTourist === "local").length / rs.length : 0;

/**
 * Split reviews into a recent bucket (within RECENT_WINDOW_DAYS of
 * `referenceDate`) and an older baseline bucket, by ACTUAL DATE. Either bucket
 * may be empty — callers handle that (see computeSignals fallbacks).
 */
function splitByRecency(
  reviews: Review[],
  referenceDate: Date,
): { older: Review[]; recent: Review[] } {
  const cutoffMs = referenceDate.getTime() - RECENT_WINDOW_DAYS * DAY_MS;
  const recent: Review[] = [];
  const older: Review[] = [];
  for (const r of reviews) {
    (Date.parse(r.dateISO) >= cutoffMs ? recent : older).push(r);
  }
  return { older, recent };
}

export interface CredibilitySignals {
  recencyScore: number;
  velocityScore: number;
  localScore: number;
  trajectoryScore: number;
  crossSourceScore: number;
  hasRecent: boolean;
  overallLocalRatio: number;
  touristRatio: number;
  recentLocalRatio: number;
  olderLocalRatio: number;
  localEngagementDelta: number;
  ratingTrajectory: number;
  recentAvgRating: number;
  olderAvgRating: number;
}

/** Exposed for tests/debugging — the raw signal computation behind a verdict. */
export function computeSignals(
  place: Place,
  referenceDate: Date = new Date(),
): CredibilitySignals {
  const { older, recent } = splitByRecency(place.reviews, referenceDate);
  const hasRecent = recent.length > 0;
  const hasOlder = older.length > 0;

  const overallLocalRatio = localShare(place.reviews);
  const touristRatio = 1 - overallLocalRatio;

  // Within-window local shares. Fall back to the overall ratio when a bucket is
  // empty, so a single populated bucket doesn't spuriously read as 0% local.
  const recentLocalRatio = hasRecent ? localShare(recent) : overallLocalRatio;
  const olderLocalRatio = hasOlder ? localShare(older) : overallLocalRatio;

  // A local-engagement SHIFT only means something with BOTH buckets present;
  // otherwise it's neutral (0) rather than a fabricated swing.
  const localEngagementDelta =
    hasRecent && hasOlder ? localShare(recent) - localShare(older) : 0;

  const recentAvgRating = hasRecent ? avg(recent.map((r) => r.rating)) : 0;
  const olderAvgRating = hasOlder ? avg(older.map((r) => r.rating)) : 0;
  // Trajectory needs a recent window AND an older baseline to compare — AND
  // enough recent points to be trustworthy. With only one bucket, or a recent
  // bucket smaller than MIN_RECENT_FOR_TRAJECTORY, it's neutral (0), never a
  // wild swing driven by one or two reviews.
  const trajectoryReliable =
    hasRecent && hasOlder && recent.length >= MIN_RECENT_FOR_TRAJECTORY;
  const ratingTrajectory = trajectoryReliable ? recentAvgRating - olderAvgRating : 0;

  return {
    // Recency: recent-90d volume, saturating at RECENCY_SATURATION.
    recencyScore: clamp01(place.recentReviewCount90d / RECENCY_SATURATION),
    // Velocity: direction of that volume.
    velocityScore: VELOCITY_SCORE[place.reviewVelocityTrend],
    // Local mix: recent-weighted, since who goes NOW matters most.
    localScore: clamp01(0.4 * overallLocalRatio + 0.6 * recentLocalRatio),
    // Trajectory: map [-1..+1]★ swing onto [0..1], neutral at 0.5.
    trajectoryScore: clamp01(0.5 + ratingTrajectory * 0.5),
    // Cross-source: agreement is already 0–1.
    crossSourceScore: clamp01(place.crossSourceAgreement),

    hasRecent,
    overallLocalRatio,
    touristRatio,
    recentLocalRatio,
    olderLocalRatio,
    localEngagementDelta,
    ratingTrajectory,
    recentAvgRating,
    olderAvgRating,
  };
}

function buildReasons(
  place: Place,
  verdict: CredibilityVerdict,
  s: CredibilitySignals,
  fadingReasons: string[] = [],
): string[] {
  const reasons: string[] = [];

  if (verdict === "tourist-trap") {
    // Did local share actually FALL? Then tell the decline story with numbers.
    // Otherwise it's a sustained/born-a-trap — cite persistence, not a drop.
    const declined = s.localEngagementDelta <= TRAP_LOCAL_DROP && s.olderLocalRatio > s.recentLocalRatio;
    if (declined) {
      reasons.push(`${pct(s.touristRatio)}% of reviews read as tourists, not locals`);
      reasons.push(`Local share fell from ${pct(s.olderLocalRatio)}% to ${pct(s.recentLocalRatio)}%`);
      reasons.push(`Rated ${place.rawRating.toFixed(1)}★, but the buzz is visitor-driven`);
    } else {
      reasons.push("Almost entirely tourists — locals don't go here");
      reasons.push(`${pct(s.touristRatio)}% of reviews are from visitors`);
      reasons.push("Highly rated by visitors, but not a local spot");
    }
  } else if (verdict === "fading") {
    // Reasons come straight from whichever fading signals actually fired
    // (assessFading), so the copy never claims a signal we didn't act on.
    reasons.push(...fadingReasons);
    if (reasons.length === 0) reasons.push("Overall interest has cooled off");
  } else {
    reasons.push(`${place.recentReviewCount90d} reviews in the last 90 days`);
    reasons.push(`${pct(s.recentLocalRatio)}% of recent reviews from locals`);
    reasons.push(
      place.reviewVelocityTrend === "rising"
        ? "Growing local following"
        : "Steady local following",
    );
  }

  return reasons.slice(0, 3);
}

interface FadingAssessment {
  isFading: boolean;
  strong: number;
  mild: number;
  reasons: string[]; // human strings for the signals that fired, strongest first
}

/**
 * Decide whether a place is FADING — and require real evidence, because a false
 * "fading" steers a user away from a good place (as damaging as missing a trap).
 *
 * Fire only on ONE STRONG signal, or TWO MILD ones:
 *   STRONG · almost no recent activity (dead now)
 *          · falling velocity AND thin recent volume (declining + drying up)
 *          · a STEEP rating slide that has dropped BELOW "excellent"
 *   MILD   · modestly low recent volume (a quiet quarter)
 *          · a falling trend while recent volume is still healthy
 *          · a mild rating easing (again, only once below "excellent")
 *          · locals softening AND now a minority
 *
 * Fix 2 guard: rating-trajectory signals only count when the recent average has
 * fallen BELOW HEALTHY_RATING_FLOOR — a 4.9→4.4 dip is still excellent, not decline.
 * Fix 3: `s.ratingTrajectory` is already 0 when the recent sample is too small to
 * trust, so trajectory can never fire on thin data.
 */
function assessFading(place: Place, s: CredibilitySignals): FadingAssessment {
  const recent = place.recentReviewCount90d;
  const velocityFalling = place.reviewVelocityTrend === "falling";
  const dried = recent < RECENT_DRIED;
  const low = recent < RECENT_LOW;

  const leftExcellent =
    s.hasRecent && s.recentAvgRating > 0 && s.recentAvgRating < HEALTHY_RATING_FLOOR;
  const trajSteep = leftExcellent && s.ratingTrajectory <= TRAJ_STEEP;
  const trajMild = leftExcellent && !trajSteep && s.ratingTrajectory <= TRAJ_MILD;
  const localSoftening =
    s.localEngagementDelta <= LOCAL_SOFTENING_DELTA && s.recentLocalRatio < LOCAL_MINORITY;

  const volumeReason =
    recent === 0 ? "No reviews in the last 90 days" : `Only ${recent} reviews in the last 90 days`;
  const slideReason = `Ratings sliding — recent ${s.recentAvgRating.toFixed(1)}★ vs ${s.olderAvgRating.toFixed(1)}★ before`;

  const strong: string[] = [];
  if (dried) strong.push(volumeReason);
  else if (velocityFalling && low) strong.push("Fewer reviews and slowing down");
  if (trajSteep) strong.push(slideReason);

  const mild: string[] = [];
  if (!dried && low && !velocityFalling) mild.push(volumeReason);
  if (velocityFalling && !low) mild.push("Review activity is trending down");
  if (trajMild) mild.push(slideReason);
  if (localSoftening) mild.push("Locals are drifting off");

  return {
    strong: strong.length,
    mild: mild.length,
    isFading: strong.length >= 1 || mild.length >= 2,
    reasons: [...strong, ...mild],
  };
}

/**
 * Classify + score a place. Verdict precedence is deliberate:
 *   1. tourist-trap — a specific fingerprint, checked FIRST because traps often
 *      look healthy by volume/rating alone. Requires RECENT activity (a dead
 *      place is fading, not a currently-thriving trap).
 *   2. fading       — general decline (falling velocity, dried-up recency, or a
 *      clearly negative rating trajectory), or a weak overall score.
 *   3. still-good   — earned: decent score, no decline, no capture by tourists.
 */
export function scoreCredibility(
  place: Place,
  referenceDate: Date = new Date(),
): CredibilityResult {
  const s = computeSignals(place, referenceDate);

  const score = Math.round(
    100 *
      (W.recency * s.recencyScore +
        W.velocity * s.velocityScore +
        W.local * s.localScore +
        W.trajectory * s.trajectoryScore +
        W.crossSource * s.crossSourceScore),
  );

  // Confidence gate FIRST: with too little data to judge, we say so plainly
  // rather than guessing a trap/fading/good verdict off a handful of reviews.
  // The score is still computed (useful for soft ranking), just flagged.
  if (place.reviewCount < MIN_REVIEWS_FOR_VERDICT) {
    return {
      verdict: "unrated",
      score,
      lowConfidence: true,
      reasons: [`Only ${place.reviewCount} reviews so far — too soon to call`],
    };
  }

  // Arm 1 — BECOMING a trap: high-rated, tourist-dominated, and local share is
  // FALLING (recent-vs-older) or already almost gone. Catches a place sliding in.
  const becomingTrap =
    place.rawRating >= TRAP_MIN_RATING &&
    s.touristRatio >= TRAP_MIN_TOURIST_RATIO &&
    (s.localEngagementDelta <= TRAP_LOCAL_DROP || s.recentLocalRatio <= TRAP_MAX_RECENT_LOCAL);

  // Arm 2 — SUSTAINED / born-a-trap: high-rated and persistently tourist-
  // dominated, locals still a minority — even with NO decline (delta ~0). Catches
  // the famous spot that's been 90% tourists for years and would otherwise slip
  // through as "still-good" because its local share never fell (it never had one).
  const sustainedTrap =
    place.rawRating >= TRAP_MIN_RATING &&
    s.touristRatio >= TRAP_SUSTAINED_TOURIST_RATIO &&
    s.recentLocalRatio <= TRAP_SUSTAINED_MAX_RECENT_LOCAL;

  const trapPattern = s.hasRecent && (becomingTrap || sustainedTrap);

  // Fading now requires 1 strong OR 2 mild signals (see assessFading) — no more
  // single-weak-signal fades. The score floor stays as a catch-all: a place too
  // weak overall to be "still good", but with no specific fading fingerprint.
  const fading = assessFading(place, s);

  let verdict: CredibilityVerdict;
  if (trapPattern) verdict = "tourist-trap";
  else if (fading.isFading || score < STILL_GOOD_MIN_SCORE) verdict = "fading";
  else verdict = "still-good";

  return { verdict, score, lowConfidence: false, reasons: buildReasons(place, verdict, s, fading.reasons) };
}
