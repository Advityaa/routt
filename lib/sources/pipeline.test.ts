import { describe, it, expect } from "vitest";
import { mockPlaces } from "../mock";
import { scoreCredibility } from "../credibility";
import { getPlaceById, getNearbyPlaces } from "../dataProvider";
import { normalizeRating, agreementFromRatings } from "./normalize";
import type { Category, Place } from "../types";

describe("rating normalization (documented 0–5 scale)", () => {
  it("maps every source scale onto 0–5", () => {
    expect(normalizeRating(4.4, 5)).toBeCloseTo(4.4); // google
    expect(normalizeRating(8.8, 10)).toBeCloseTo(4.4); // foursquare
    expect(normalizeRating(0.88, 1)).toBeCloseTo(4.4); // reddit sentiment
    expect(normalizeRating(12, 5)).toBe(5); // clamps
  });

  it("derives cross-source agreement from rating spread", () => {
    expect(agreementFromRatings([4.4, 4.4, 4.4])).toBe(1); // total agreement
    expect(agreementFromRatings([5, 3])).toBeCloseTo(0.2); // 2-star spread / 2.5
    expect(agreementFromRatings([4.5])).toBe(1); // single source
  });
});

// crossSourceAgreement is now COMPUTED from the merged sources (no longer the
// baked mock field) and reviews carry a source tag — so the reconstructed Place
// matches the mock on every stable field, keeps the same verdict, and its
// agreement lands close to the authored design knob.
const stripReviewSource = (p: Place) =>
  p.reviews.map(({ source, localProbability, ...rest }) => rest);
// Now-computed fields: crossSourceAgreement (from source spread), rawRating (the
// cross-source average — can drift a touch when a source rating clamps at 5),
// and the per-review source tag. Everything else must be identical to the mock.
const withoutComputed = (p: Place) => {
  const { crossSourceAgreement, rawRating, reviews, photos, sources, matchConfidence, ...rest } = p;
  return rest;
};

describe("pipeline reproduces the mock dataset (agreement now computed)", () => {
  it("getPlaceById returns a Place matching the mock on all stable fields", async () => {
    for (const mock of mockPlaces) {
      const res = await getPlaceById({ id: mock.id, lat: mock.lat, lng: mock.lng });
      expect(res, `missing ${mock.id}`).not.toBeNull();
      const place = res!.place;

      // Everything except the now-computed fields is identical.
      expect(withoutComputed(place)).toEqual(withoutComputed(mock));
      expect(stripReviewSource(place)).toEqual(stripReviewSource(mock));
      for (const r of place.reviews) expect(r.source).toBeTruthy();

      // Agreement is real now: tracks the authored knob (exact for most; up to
      // ~0.12 higher for very high ratings where a source clamps at 5, narrowing
      // the observed spread), and always a valid 0–1.
      expect(place.crossSourceAgreement).toBeGreaterThanOrEqual(0);
      expect(place.crossSourceAgreement).toBeLessThanOrEqual(1);
      expect(Math.abs(place.crossSourceAgreement - mock.crossSourceAgreement)).toBeLessThanOrEqual(0.15);
      // rawRating is the cross-source average — very close to the authored value.
      expect(Math.abs(place.rawRating - mock.rawRating)).toBeLessThanOrEqual(0.15);

      // Verdict stays stable through the real pipeline.
      expect(res!.credibility.verdict).toBe(scoreCredibility(mock).verdict);
    }
  });

  it("the feed for each category returns the expected mock places", async () => {
    const cats: Category[] = ["eat", "drink", "shop", "see"];
    for (const category of cats) {
      const feed = await getNearbyPlaces({ category, lat: 13.7563, lng: 100.5018, nowHour: 13 });
      expect(feed.length).toBeGreaterThan(0);
      expect(feed.length).toBeLessThanOrEqual(5);
      for (const { place } of feed) {
        expect(place.category).toBe(category);
        const mock = mockPlaces.find((p) => p.id === place.id)!;
        expect(withoutComputed(place)).toEqual(withoutComputed(mock));
      }
    }
  });
});
