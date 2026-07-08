import { describe, it, expect } from "vitest";
import { rollupSignals, type VenueReview } from "./store";

const NOW = new Date("2026-07-07T12:00:00Z");
let n = 0;
const rev = (daysAgo: number, over: Partial<VenueReview>): VenueReview => ({
  id: `r${++n}`, gers_id: "g1", user_id: `u${n}`, handle: null, quick: null,
  rating: null, text: null, is_local: false, price_paid: null, photo_url: null,
  moderated: false, reported: false,
  created_at: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
  ...over,
});

describe("first-party rollup (verdicts only from real signals)", () => {
  it("zero reviews → not-rated", () => {
    expect(rollupSignals("g1", [], NOW).verdict_state).toBe("not-rated");
  });
  it("below threshold → early, with true count", () => {
    const s = rollupSignals("g1", [rev(1, { rating: 5 }), rev(2, { rating: 5 })], NOW);
    expect(s.verdict_state).toBe("early");
    expect(s.review_count_90d).toBe(2);
  });
  it("5+ recent positive reports → still-good with local %", () => {
    const rs = [rev(1,{rating:5,is_local:true}), rev(3,{rating:4,is_local:true}), rev(9,{quick:"still-good"}), rev(15,{rating:5,is_local:true}), rev(30,{rating:4})];
    const s = rollupSignals("g1", rs, NOW);
    expect(s.verdict_state).toBe("still-good");
    expect(s.local_pct).toBe(60);
  });
  it("negative + closed reports → fading; reported rows excluded", () => {
    const rs = [rev(2,{quick:"closed"}), rev(4,{rating:2}), rev(6,{quick:"not-what-it-was"}), rev(9,{rating:2}), rev(12,{quick:"closed"}), rev(1,{rating:5,reported:true})];
    const s = rollupSignals("g1", rs, NOW);
    expect(s.verdict_state).toBe("fading");
    expect(s.review_count_90d).toBe(5); // reported row not counted
  });
  it("old reviews (>90d) don't count; recency weighting favors new", () => {
    const s = rollupSignals("g1", [rev(120, { rating: 5 })], NOW);
    expect(s.verdict_state).toBe("not-rated");
  });
});
