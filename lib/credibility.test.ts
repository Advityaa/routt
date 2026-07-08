import { describe, it, expect } from "vitest";
import { scoreCredibility, computeSignals } from "./credibility";
import type { Place, Review, ReviewOrigin } from "./types";
import { mockPlaces } from "./mock";

// Fixed reference "now" so every test is deterministic regardless of wall clock.
const REF = new Date("2026-07-02T12:00:00Z");

// ── fixtures ─────────────────────────────────────────────────────────────────
const rv = (rating: number, dateISO: string, origin: ReviewOrigin): Review => ({
  rating,
  dateISO,
  looksLocalOrTourist: origin,
  text: "",
  language: origin === "local" ? "th" : "en",
});

const basePlace: Place = {
  id: "x",
  name: "X",
  category: "eat",
  lat: 13.75,
  lng: 100.5,
  neighborhood: "Test",
  priceLevel: 2,
  homeCurrencyEstimate: "~$5",
  rawRating: 4.4,
  reviewCount: 1000,
  recentReviewCount90d: 40,
  reviewVelocityTrend: "steady",
  crossSourceAgreement: 0.85,
  busyByHour: Array(24).fill(0.5),
  reviews: [],
};

const makePlace = (overrides: Partial<Place>): Place => ({ ...basePlace, ...overrides });

// Recent (within 180d of REF) + local-majority + flat/rising ratings.
const healthyReviews: Review[] = [
  rv(5, "2026-06-19", "local"),
  rv(4, "2026-05-28", "local"),
  rv(5, "2026-04-15", "tourist"),
  rv(4, "2025-12-08", "local"),
  rv(5, "2025-07-20", "local"),
  rv(4, "2024-10-11", "local"),
];

// Recent reviews are tourist-only; locals were here years ago.
const trapReviewSet: Review[] = [
  rv(5, "2026-06-21", "tourist"),
  rv(5, "2026-06-02", "tourist"),
  rv(4, "2026-04-20", "tourist"),
  rv(5, "2026-03-30", "tourist"),
  rv(4, "2025-05-05", "local"),
  rv(5, "2024-08-14", "local"),
];

// Was great, ratings slipping.
const decliningReviews: Review[] = [
  rv(3, "2026-05-02", "local"),
  rv(3, "2026-02-15", "tourist"),
  rv(4, "2025-08-20", "local"),
  rv(5, "2025-03-10", "local"),
  rv(5, "2024-11-05", "local"),
  rv(4, "2024-06-01", "local"),
];

// Sustained / born-a-trap: tourist-dominated across ALL of history, no decline.
// Locals are a persistent minority (one recent local), overall ~88% tourist.
const sustainedTrapReviews: Review[] = [
  rv(5, "2026-06-10", "tourist"),
  rv(5, "2026-05-05", "tourist"),
  rv(4, "2026-04-01", "local"),
  rv(5, "2025-10-01", "tourist"),
  rv(4, "2025-06-01", "tourist"),
  rv(5, "2024-12-01", "tourist"),
  rv(4, "2024-07-01", "tourist"),
  rv(5, "2023-09-01", "tourist"),
];

// Many reviews, but ALL older than the recent window (a once-popular, now-dead place).
const onlyOldReviews: Review[] = [
  rv(5, "2024-03-10", "local"),
  rv(5, "2023-11-05", "local"),
  rv(4, "2023-08-20", "local"),
  rv(5, "2023-05-01", "local"),
  rv(4, "2022-12-14", "local"),
];

// ── tests ────────────────────────────────────────────────────────────────────
describe("scoreCredibility — verdict rules", () => {
  it("returns STILL-GOOD for a recent, steady, local-majority place", () => {
    const r = scoreCredibility(
      makePlace({ reviews: healthyReviews, recentReviewCount90d: 40, reviewVelocityTrend: "steady" }),
      REF,
    );
    expect(r.verdict).toBe("still-good");
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(r.reasons.length).toBeGreaterThanOrEqual(1);
    expect(r.reasons.length).toBeLessThanOrEqual(3);
  });

  it("returns FADING when review velocity is falling", () => {
    const r = scoreCredibility(
      makePlace({
        rawRating: 3.9,
        reviews: decliningReviews,
        recentReviewCount90d: 4,
        reviewVelocityTrend: "falling",
        crossSourceAgreement: 0.6,
      }),
      REF,
    );
    expect(r.verdict).toBe("fading");
  });

  it("returns FADING when recent reviews have dried up (even if velocity is steady)", () => {
    const r = scoreCredibility(
      makePlace({
        rawRating: 4.1,
        reviews: healthyReviews,
        recentReviewCount90d: 3, // < FADING_MIN_RECENT
        reviewVelocityTrend: "steady",
      }),
      REF,
    );
    expect(r.verdict).toBe("fading");
  });

  it("returns TOURIST-TRAP for a high rating that is tourist-dominated with falling local engagement", () => {
    const r = scoreCredibility(
      makePlace({
        rawRating: 4.5,
        reviews: trapReviewSet,
        recentReviewCount90d: 120,
        reviewVelocityTrend: "steady",
        crossSourceAgreement: 0.5,
      }),
      REF,
    );
    expect(r.verdict).toBe("tourist-trap");
    const s = computeSignals(makePlace({ reviews: trapReviewSet, rawRating: 4.5 }), REF);
    expect(s.touristRatio).toBeGreaterThanOrEqual(0.65);
  });

  it("prioritises TOURIST-TRAP over fading when both a trap fingerprint and falling velocity are present", () => {
    const r = scoreCredibility(
      makePlace({
        rawRating: 4.5,
        reviews: trapReviewSet,
        recentReviewCount90d: 80,
        reviewVelocityTrend: "falling",
        crossSourceAgreement: 0.5,
      }),
      REF,
    );
    expect(r.verdict).toBe("tourist-trap");
  });

  it("does NOT flag a high-rated but local-majority place as a tourist trap", () => {
    const r = scoreCredibility(
      makePlace({ rawRating: 4.7, reviews: healthyReviews, recentReviewCount90d: 50 }),
      REF,
    );
    expect(r.verdict).toBe("still-good");
  });
});

describe("scoreCredibility — both trap types", () => {
  it("flags a place DECLINING into a trap (local share fell)", () => {
    const p = makePlace({
      rawRating: 4.5,
      reviews: trapReviewSet,
      recentReviewCount90d: 120,
      reviewVelocityTrend: "steady",
      crossSourceAgreement: 0.5,
    });
    const s = computeSignals(p, REF);
    expect(scoreCredibility(p, REF).verdict).toBe("tourist-trap");
    expect(s.localEngagementDelta).toBeLessThanOrEqual(-0.12); // it actually fell
  });

  it("flags an ALWAYS-a-trap (sustained) place that never had a local base", () => {
    const p = makePlace({
      rawRating: 4.6,
      reviewCount: 40000,
      reviews: sustainedTrapReviews,
      recentReviewCount90d: 150,
      reviewVelocityTrend: "steady",
      crossSourceAgreement: 0.5,
    });
    const s = computeSignals(p, REF);
    expect(scoreCredibility(p, REF).verdict).toBe("tourist-trap");
    // Proves arm 2 did the work — the "becoming a trap" arm can't catch this:
    // local share did NOT fall, and recent locals sit above the decline threshold.
    expect(s.localEngagementDelta).toBeGreaterThan(-0.12);
    expect(s.recentLocalRatio).toBeGreaterThan(0.3);
    expect(s.touristRatio).toBeGreaterThanOrEqual(0.8);
  });

  it("gives a sustained trap persistence copy, not a (nonexistent) local-share drop", () => {
    const p = makePlace({ rawRating: 4.6, reviews: sustainedTrapReviews, recentReviewCount90d: 150 });
    const reasons = scoreCredibility(p, REF).reasons;
    expect(reasons.some((r) => /fell from/i.test(r))).toBe(false);
    expect(reasons.some((r) => /locals don't go here|not a local spot/i.test(r))).toBe(true);
  });
});

// The core fix: recency is measured by ACTUAL DATE relative to referenceDate.
describe("scoreCredibility — time-relative recency (the bug fix)", () => {
  it("a place with only OLD reviews is NOT alive, even with many total reviews", () => {
    const place = makePlace({
      rawRating: 4.6,
      reviewCount: 5000, // lots of lifetime reviews...
      recentReviewCount90d: 0, // ...but nothing recent
      reviewVelocityTrend: "steady",
      reviews: onlyOldReviews,
    });
    const s = computeSignals(place, REF);
    expect(s.hasRecent).toBe(false);
    expect(s.recencyScore).toBe(0);
    // Neutral, not a fabricated swing, when there's no recent window to compare.
    expect(s.ratingTrajectory).toBe(0);
    expect(s.localEngagementDelta).toBe(0);
    expect(scoreCredibility(place, REF).verdict).toBe("fading");
  });

  it("a place with recent reviews IS alive", () => {
    const place = makePlace({
      reviews: healthyReviews,
      recentReviewCount90d: 40,
      reviewVelocityTrend: "steady",
    });
    expect(computeSignals(place, REF).hasRecent).toBe(true);
    expect(scoreCredibility(place, REF).verdict).toBe("still-good");
  });

  it("the recent/older split MOVES with referenceDate (proves it is not position-based)", () => {
    // Old local + high ratings, then newer tourist + low ratings. Enough recent
    // points (≥ MIN_RECENT_FOR_TRAJECTORY) so trajectory is trusted in 2025.
    const place = makePlace({
      reviews: [
        rv(5, "2023-01-10", "local"),
        rv(5, "2023-03-10", "local"),
        rv(5, "2023-06-10", "local"),
        rv(3, "2025-04-10", "tourist"),
        rv(3, "2025-05-10", "tourist"),
        rv(3, "2025-06-10", "tourist"),
        rv(3, "2025-07-10", "tourist"),
      ],
    });

    // Viewed in 2025: the 2025 tourist reviews are "recent" vs the 2023 baseline.
    const s2025 = computeSignals(place, new Date("2025-09-01T00:00:00Z"));
    expect(s2025.hasRecent).toBe(true);
    expect(s2025.ratingTrajectory).toBeLessThan(0); // ratings slipped
    expect(s2025.localEngagementDelta).toBeLessThan(0); // locals gave way to tourists

    // Viewed in 2026: ALL reviews are now old → neutral, not a stale swing.
    const s2026 = computeSignals(place, REF);
    expect(s2026.hasRecent).toBe(false);
    expect(s2026.ratingTrajectory).toBe(0);
    expect(s2026.localEngagementDelta).toBe(0);
  });
});

describe("scoreCredibility — thin data → unrated", () => {
  const thinReviews: Review[] = [
    rv(5, "2026-06-25", "local"),
    rv(5, "2026-06-12", "local"),
    rv(4, "2026-05-20", "tourist"),
  ];

  it("returns UNRATED on too few reviews, but still computes a score and stays low-confidence", () => {
    const p = makePlace({
      rawRating: 4.8,
      reviewCount: 3,
      recentReviewCount90d: 3,
      reviewVelocityTrend: "rising",
      reviews: thinReviews,
    });
    const r = scoreCredibility(p, REF);
    expect(r.verdict).toBe("unrated");
    expect(r.lowConfidence).toBe(true);
    expect(r.score).toBeGreaterThan(0); // score still computed
    // No confident trajectory / local-share claims on a 3-review sample.
    expect(r.reasons.length).toBe(1);
    expect(r.reasons.some((x) => /local share|slipping|% of/i.test(x))).toBe(false);
    expect(r.reasons[0]).toMatch(/too soon|not enough|reviews so far/i);
  });

  it("does not let a 4.9★ on 3 reviews masquerade as still-good", () => {
    const p = makePlace({
      rawRating: 4.9,
      reviewCount: 3,
      recentReviewCount90d: 3,
      reviews: thinReviews,
    });
    expect(scoreCredibility(p, REF).verdict).toBe("unrated");
  });

  it("does NOT auto-fade a healthy place that dips to 5 recent reviews", () => {
    const p = makePlace({
      rawRating: 4.5,
      reviewCount: 300, // plenty of lifetime data → not unrated
      recentReviewCount90d: 5, // a quiet quarter, but 5 is borderline-alive
      reviewVelocityTrend: "steady",
      reviews: healthyReviews,
    });
    const r = scoreCredibility(p, REF);
    expect(r.verdict).not.toBe("fading");
    expect(r.verdict).toBe("still-good");
    expect(r.lowConfidence).toBe(false);
  });
});

describe("scoreCredibility — fading is conservative (no single-signal fades)", () => {
  // A rating dip that STAYS excellent: ~5.0★ older → ~4.5★ recent, local-majority.
  const excellentDipReviews: Review[] = [
    rv(4, "2026-06-20", "local"),
    rv(5, "2026-05-15", "local"),
    rv(4, "2026-04-10", "local"),
    rv(5, "2026-02-05", "local"), // recent avg 4.5 (≥ HEALTHY_RATING_FLOOR)
    rv(5, "2025-09-01", "local"),
    rv(5, "2025-05-01", "local"),
    rv(5, "2024-12-01", "local"), // older avg 5.0
  ];

  it("a top place with ONE slow quarter (low recent volume only) stays still-good", () => {
    const r = scoreCredibility(
      makePlace({
        rawRating: 4.6,
        reviewCount: 1500,
        recentReviewCount90d: 10, // one mild signal (modestly low) — but only one
        reviewVelocityTrend: "steady",
        reviews: healthyReviews,
      }),
      REF,
    );
    expect(r.verdict).toBe("still-good");
  });

  it("a rating dip that stays EXCELLENT (~5.0★→~4.5★) is not fading", () => {
    const p = makePlace({
      rawRating: 4.6,
      reviewCount: 1500,
      recentReviewCount90d: 30, // healthy volume
      reviewVelocityTrend: "steady",
      reviews: excellentDipReviews,
    });
    const s = computeSignals(p, REF);
    // Trajectory really did fall, and it's a reliable (≥4-point) recent sample...
    expect(s.ratingTrajectory).toBeLessThan(0);
    expect(s.recentAvgRating).toBeGreaterThanOrEqual(4.3);
    // ...but because it's still excellent, it must not drive a fade.
    expect(scoreCredibility(p, REF).verdict).toBe("still-good");
  });

  it("genuinely falling velocity + dried-up recent volume IS fading", () => {
    const r = scoreCredibility(
      makePlace({
        rawRating: 4.0,
        reviewCount: 1000,
        recentReviewCount90d: 4, // dried up
        reviewVelocityTrend: "falling", // and declining
        reviews: decliningReviews,
      }),
      REF,
    );
    expect(r.verdict).toBe("fading");
  });

  it("one MILD signal alone does not fade, but TWO do", () => {
    // ONE mild only: a falling trend but recent volume still healthy, ratings
    // still excellent, locals still the majority. Benefit of the doubt → good.
    const oneMild = makePlace({
      rawRating: 4.6,
      reviewCount: 800,
      recentReviewCount90d: 30, // healthy volume → "falling" is only a MILD signal
      reviewVelocityTrend: "falling",
      reviews: healthyReviews,
    });
    expect(scoreCredibility(oneMild, REF).verdict).toBe("still-good");

    // TWO mild: that same falling trend PLUS a mild rating easing that has
    // slipped just below "excellent" (4.33★→4.0★). Two mild → fading.
    const easingReviews: Review[] = [
      rv(4, "2026-06-15", "local"),
      rv(4, "2026-05-10", "local"),
      rv(4, "2026-04-05", "local"),
      rv(4, "2026-02-10", "local"), // recent avg 4.0 (< 4.3), reliable 4-pt sample
      rv(5, "2025-08-01", "local"),
      rv(4, "2025-04-01", "local"),
      rv(4, "2024-11-01", "local"), // older avg 4.33 → trajectory ≈ -0.33 (mild)
    ];
    const twoMild = makePlace({
      rawRating: 4.3,
      reviewCount: 800,
      recentReviewCount90d: 30,
      reviewVelocityTrend: "falling",
      reviews: easingReviews,
    });
    expect(scoreCredibility(twoMild, REF).verdict).toBe("fading");
  });
});

describe("scoreCredibility — contract", () => {
  it("is pure/deterministic (same inputs → identical output)", () => {
    const p = makePlace({ reviews: healthyReviews });
    expect(scoreCredibility(p, REF)).toEqual(scoreCredibility(p, REF));
  });

  it("always returns 1–3 human-readable reasons for every mock place", () => {
    for (const place of mockPlaces) {
      const r = scoreCredibility(place, REF);
      expect(r.reasons.length).toBeGreaterThanOrEqual(1);
      expect(r.reasons.length).toBeLessThanOrEqual(3);
      for (const reason of r.reasons) expect(reason.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps score within 0–100", () => {
    for (const place of mockPlaces) {
      const { score } = scoreCredibility(place, REF);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe("mock dataset ties to the engine", () => {
  it("classifies seeded example places as intended", () => {
    const verdictOf = (id: string) =>
      scoreCredibility(mockPlaces.find((p) => p.id === id)!, REF).verdict;
    expect(verdictOf("eat-jok-prince")).toBe("still-good");
    expect(verdictOf("eat-thip-grand-padthai")).toBe("tourist-trap"); // declining trap
    expect(verdictOf("shop-patpong-bazaar")).toBe("tourist-trap"); // sustained/born trap
    expect(verdictOf("eat-cafe-nostalgia")).toBe("fading");
    expect(verdictOf("eat-soi-38-newcomer")).toBe("unrated"); // thin data
  });

  it("contains at least one place of each verdict", () => {
    const verdicts = new Set(mockPlaces.map((p) => scoreCredibility(p, REF).verdict));
    expect(verdicts.has("still-good")).toBe(true);
    expect(verdicts.has("fading")).toBe(true);
    expect(verdicts.has("tourist-trap")).toBe(true);
  });
});

// ── demo output (printed by `vitest run`) ────────────────────────────────────
describe("scored examples (sanity-check output)", () => {
  it("prints one place of each verdict with its signals", () => {
    const wanted = ["still-good", "fading", "tourist-trap", "unrated"] as const;
    const lines: string[] = [];
    for (const verdict of wanted) {
      const place = mockPlaces.find((p) => scoreCredibility(p, REF).verdict === verdict)!;
      const s = computeSignals(place, REF);
      const r = scoreCredibility(place, REF);
      lines.push(
        `\n▸ ${r.verdict.toUpperCase()}  —  ${place.name} (${place.category}, ${place.neighborhood})`,
        `  rawRating ${place.rawRating}★ · totalReviews ${place.reviewCount} · recent90d ${place.recentReviewCount90d} · velocity ${place.reviewVelocityTrend}`,
        `  hasRecent ${s.hasRecent} · touristRatio ${Math.round(s.touristRatio * 100)}% · localΔ ${Math.round(s.localEngagementDelta * 100)}% · ratingTraj ${s.ratingTrajectory.toFixed(2)}`,
        `  => score ${r.score}/100 · lowConfidence ${r.lowConfidence}`,
        ...r.reasons.map((x) => `     • ${x}`),
      );
      expect(place).toBeTruthy();
    }

    // Point-6 guard: a healthy place that dips to 5 recent reviews must NOT auto-fade.
    const dip = makePlace({
      rawRating: 4.5,
      reviewCount: 300,
      recentReviewCount90d: 5,
      reviewVelocityTrend: "steady",
      reviews: healthyReviews,
    });
    const dipR = scoreCredibility(dip, REF);
    lines.push(
      `\n▸ DIP-TO-5 (healthy place, quiet quarter — must NOT auto-fade)`,
      `  recent90d 5 · velocity steady · totalReviews 300`,
      `  => verdict ${dipR.verdict.toUpperCase()} · score ${dipR.score}/100 · lowConfidence ${dipR.lowConfidence}`,
    );
    expect(dipR.verdict).toBe("still-good");

    // Fading-is-conservative cases (Fix): these must classify as noted.
    const conservative: { label: string; place: Place }[] = [
      {
        label: "SLOW QUARTER (recent 10, steady, 4.6★) → expect still-good",
        place: makePlace({ rawRating: 4.6, reviewCount: 1500, recentReviewCount90d: 10, reviewVelocityTrend: "steady", reviews: healthyReviews }),
      },
      {
        label: "RATING DIP within excellent (~5.0★→~4.5★, recent 30) → expect still-good",
        place: makePlace({
          rawRating: 4.6, reviewCount: 1500, recentReviewCount90d: 30, reviewVelocityTrend: "steady",
          reviews: [
            rv(4, "2026-06-20", "local"), rv(5, "2026-05-15", "local"), rv(4, "2026-04-10", "local"), rv(5, "2026-02-05", "local"),
            rv(5, "2025-09-01", "local"), rv(5, "2025-05-01", "local"), rv(5, "2024-12-01", "local"),
          ],
        }),
      },
      {
        label: "FALLING velocity + DRIED volume (recent 4) → expect fading",
        place: makePlace({ rawRating: 4.0, reviewCount: 1000, recentReviewCount90d: 4, reviewVelocityTrend: "falling", reviews: decliningReviews }),
      },
    ];
    for (const c of conservative) {
      const rr = scoreCredibility(c.place, REF);
      lines.push(`\n▸ ${c.label}`, `  => ${rr.verdict.toUpperCase()} (score ${rr.score}) — ${rr.reasons.join("; ")}`);
    }

    // eslint-disable-next-line no-console
    console.log(lines.join("\n"));
  });
});
