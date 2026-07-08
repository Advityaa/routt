import { describe, it, expect } from "vitest";
import { agreementSummary } from "../components/TrustReport";
import type { PlaceSourceRecord } from "./types";

const g = (rating: number, n = 500): PlaceSourceRecord => ({ source: "google", rating, ratingScaleMax: 5, reviewCount: n });
const f = (rating: number, n = 60): PlaceSourceRecord => ({ source: "foursquare", rating, ratingScaleMax: 10, reviewCount: n });
const r = (rating: number, n = 12): PlaceSourceRecord => ({ source: "reddit", rating, ratingScaleMax: 1, reviewCount: n });

describe("agreementSummary — plain-language trust states", () => {
  it("agree: names all sources, reads positive", () => {
    const s = agreementSummary([g(4.5), f(9.0), r(0.9)], 0.86);
    expect(s.tone).toBe("good");
    expect(s.text).toMatch(/Sources agree/);
    expect(s.text).toMatch(/Google, Foursquare and Reddit/);
  });

  it("disagree: names the high source and calls out Reddit locals honestly", () => {
    const s = agreementSummary([g(4.9), f(8.5), r(0.55)], 0.51);
    expect(s.tone).toBe("warn");
    expect(s.text).toMatch(/Sources disagree/);
    expect(s.text).toMatch(/high on Google/);
    expect(s.text).toMatch(/locals on Reddit are much cooler/);
  });

  it("single source: admits less cross-checking", () => {
    const s = agreementSummary([g(4.6)], 1);
    expect(s.tone).toBe("neutral");
    expect(s.text).toMatch(/Only found on Google/);
    expect(s.text).toMatch(/less cross-checked/);
  });
});
