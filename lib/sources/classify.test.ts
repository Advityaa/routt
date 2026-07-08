import { describe, it, expect } from "vitest";
import { classifyLocalProbability, originFromProbability } from "./classify";
import type { RawReview } from "./types";

const rv = (text: string, language = "und"): RawReview => ({ text, rating: 4, dateISO: "2026-06-01", language });

// These tests pin the FIRST-PASS heuristic's behavior — not its correctness.
// It's the weakest link (see classify.ts); expect it to be beatable.
describe("local/tourist heuristic (first-pass, weakest link)", () => {
  it("treats Thai-language reviews as strongly local", () => {
    expect(classifyLocalProbability(rv("อร่อยมาก มากินประจำ", "th"))).toBeGreaterThan(0.7);
  });

  it("leans tourist on visitor phrasing", () => {
    expect(
      classifyLocalProbability(rv("On my trip to Bangkok, a must-see bucket-list spot!", "en")),
    ).toBeLessThan(0.5);
  });

  it("leans local on regular-visitor phrasing", () => {
    expect(classifyLocalProbability(rv("My go-to, I come here every week", "en"))).toBeGreaterThan(0.5);
  });

  it("stays near 0.5 when there are no cues", () => {
    const p = classifyLocalProbability(rv("Good food.", "en"));
    expect(p).toBeGreaterThan(0.35);
    expect(p).toBeLessThan(0.55);
  });

  it("thresholds probability into the boolean the engine consumes", () => {
    expect(originFromProbability(0.8)).toBe("local");
    expect(originFromProbability(0.2)).toBe("tourist");
    expect(originFromProbability(0.5)).toBe("local");
  });
});
