import { describe, it, expect } from "vitest";
import { mergeCluster, computeCrossSourceAgreement } from "./normalize";
import { scoreCredibility } from "../credibility";
import { getPlaceById } from "../dataProvider";
import type { RawReview, RawSourceDetails } from "./types";
import type { Category, ReviewVelocityTrend } from "../types";

const REF = new Date("2026-07-07T12:00:00Z");
const META = { id: "x", name: "Test Place", category: "eat" as Category, lat: 13.75, lng: 100.5 };

type Origin = "local" | "tourist";
const rv = (rating: number, dateISO: string, origin: Origin, text = ""): RawReview => ({
  rating,
  dateISO,
  looksLocalOrTourist: origin,
  language: origin === "local" ? "th" : "en",
  text,
});

// A healthy, recent, local-majority corpus (google carries it as primary).
const HEALTHY: RawReview[] = [
  rv(5, "2026-06-19", "local", "great"),
  rv(4, "2026-05-28", "local", "solid"),
  rv(5, "2026-04-15", "tourist", "loved it"),
  rv(4, "2025-12-08", "local", "regular"),
  rv(5, "2025-07-20", "local", "always good"),
  rv(4, "2024-10-11", "local", "institution"),
];

/** Build a 3-source detail set with the given normalized ratings. Google is primary. */
function detailsFor(
  norm: [number, number, number],
  opts: { reviews?: RawReview[]; recent?: number; velocity?: ReviewVelocityTrend; reviewCount?: number } = {},
): RawSourceDetails[] {
  const sources = ["google", "foursquare", "reddit"] as const;
  return sources.map((source, i) => {
    const base: RawSourceDetails = {
      sourceName: source,
      sourceId: `${source}_x`,
      name: META.name,
      rating: norm[i],
      ratingScaleMax: 5,
      ratingNormalized: norm[i],
      reviewCount: opts.reviewCount ?? 500,
      reviews: [],
      photos: [],
    };
    if (source === "google") {
      base.reviews = opts.reviews ?? HEALTHY;
      base.recentReviewCount90d = opts.recent ?? 40;
      base.reviewVelocityTrend = opts.velocity ?? "steady";
      base.neighborhood = "Test";
      base.priceLevel = 2;
      base.homeCurrencyEstimate = "~$5";
      base.popularByHour = new Array(24).fill(0.5);
    }
    return base;
  });
}

describe("computeCrossSourceAgreement", () => {
  it("is high when sources agree, low when they disagree", () => {
    expect(computeCrossSourceAgreement([4.6, 4.6, 4.6], 3)).toBe(1);
    expect(computeCrossSourceAgreement([4.7, 3.4, 2.2], 3)).toBeLessThan(0.1); // 2.5-star spread
  });
  it("drops when few of the consulted sources corroborate", () => {
    expect(computeCrossSourceAgreement([4.6], 3)).toBeCloseTo(1 / 3, 5); // only 1 of 3 found it
    expect(computeCrossSourceAgreement([4.6, 4.6], 3)).toBeCloseTo(2 / 3, 5);
  });
});

describe("merged review corpus", () => {
  it("combines reviews across sources, tags each, and de-dupes obvious repeats", () => {
    const A = rv(5, "2026-06-01", "local", "same review text");
    const B = rv(4, "2026-05-01", "tourist", "different review");
    const C = rv(5, "2026-04-01", "local", "reddit only");
    const details: RawSourceDetails[] = [
      { sourceName: "google", sourceId: "g", name: "X", rating: 4.5, ratingScaleMax: 5, ratingNormalized: 4.5, reviewCount: 500, reviews: [A], photos: [], recentReviewCount90d: 40, reviewVelocityTrend: "steady", neighborhood: "T", priceLevel: 2, homeCurrencyEstimate: "~$5" },
      { sourceName: "foursquare", sourceId: "f", name: "X", rating: 9, ratingScaleMax: 10, ratingNormalized: 4.5, reviewCount: 500, reviews: [{ ...A }, B], photos: [] }, // echoes A + adds B
      { sourceName: "reddit", sourceId: "r", name: "X", rating: 0.9, ratingScaleMax: 1, ratingNormalized: 4.5, reviewCount: 500, reviews: [C], photos: [] },
    ];
    const place = mergeCluster(META, details, 3);
    expect(place.reviews).toHaveLength(3); // A (deduped), B, C — not 4
    const bySource = Object.fromEntries(place.reviews.map((r) => [r.text, r.source]));
    expect(bySource["same review text"]).toBe("google"); // kept from primary, not fsq echo
    expect(bySource["different review"]).toBe("foursquare");
    expect(bySource["reddit only"]).toBe("reddit");
  });
});

describe("disagreement lowers confidence (the point)", () => {
  it("a place only one source rates highly gets lower agreement, score, AND verdict", () => {
    // Same reviews + volume; the ONLY difference is how much the sources agree.
    const agree = mergeCluster(META, detailsFor([4.6, 4.6, 4.6], { recent: 8, reviewCount: 300 }), 3);
    const disagree = mergeCluster(META, detailsFor([4.8, 3.3, 1.9], { recent: 8, reviewCount: 300 }), 3);

    expect(disagree.crossSourceAgreement).toBeLessThan(agree.crossSourceAgreement);

    const rAgree = scoreCredibility(agree, REF);
    const rDisagree = scoreCredibility(disagree, REF);
    expect(rDisagree.score).toBeLessThan(rAgree.score); // agreement flows into the score
    // At this borderline volume the confidence hit flips the verdict too.
    expect(rAgree.verdict).toBe("still-good");
    expect(rDisagree.verdict).toBe("fading");
  });
});

// ── demo output ──────────────────────────────────────────────────────────────
describe("real cross-checked examples (sanity-check output)", () => {
  it("prints computed agreement + verdict + score for real-shaped resolved places", async () => {
    const lines: string[] = [];

    const ids = ["eat-jok-prince", "eat-thip-grand-padthai", "drink-skyfall-rooftop"];
    for (const id of ids) {
      const res = (await getPlaceById({ id, lat: 13.7563, lng: 100.5018 }))!;
      const p = res.place;
      lines.push(
        `\n▸ ${p.name} (${p.category})`,
        `   crossSourceAgreement ${p.crossSourceAgreement.toFixed(2)}  ·  reviews merged ${p.reviews.length}`,
        `   => ${res.credibility.verdict.toUpperCase()}  ·  score ${res.credibility.score}/100`,
      );
    }

    lines.push("\n── same place, sources AGREE vs DISAGREE ──");
    const agree = mergeCluster(META, detailsFor([4.6, 4.6, 4.6], { recent: 8, reviewCount: 300 }), 3);
    const disagree = mergeCluster(META, detailsFor([4.8, 3.3, 1.9], { recent: 8, reviewCount: 300 }), 3);
    for (const [label, place] of [["AGREE   ", agree], ["DISAGREE", disagree]] as const) {
      const r = scoreCredibility(place, REF);
      lines.push(
        `   ${label}  agreement ${place.crossSourceAgreement.toFixed(2)}  rawRating ${place.rawRating}  =>  ${r.verdict.toUpperCase()} (score ${r.score})`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(lines.join("\n"));
    expect(lines.length).toBeGreaterThan(0);
  });
});
