import { describe, it, expect } from "vitest";
import {
  resolvePlaces,
  nameSimilarity,
  normalizeName,
  distanceMeters,
  isSamePlace,
  NAME_SIM_FLOOR,
} from "./index";
import type { RawSourcePlace, SourceName } from "../sources/types";
import type { Category } from "../types";
import { mockPlaces } from "../mock";
import { mockSearchNearby } from "../sources/mockData";

// ── fixtures ─────────────────────────────────────────────────────────────────
let counter = 0;
function mk(
  sourceName: SourceName,
  name: string,
  lat: number,
  lng: number,
  opts: { category?: Category; rating?: number; scale?: 1 | 5 | 10; reviewCount?: number } = {},
): RawSourcePlace {
  return {
    sourceName,
    sourceId: `${sourceName}_${++counter}`,
    name,
    lat,
    lng,
    category: opts.category ?? "eat",
    rating: opts.rating ?? 4.5,
    ratingScaleMax: opts.scale ?? 5,
    reviewCount: opts.reviewCount ?? 100,
  };
}

// ── matching primitives ──────────────────────────────────────────────────────
describe("name normalization + similarity", () => {
  it("strips accents, case, punctuation and generic words", () => {
    expect(normalizeName("Café Niño")).toEqual(["nino"]); // accent removed, "cafe" dropped
    expect(normalizeName("Jok Prince Restaurant")).toEqual(["jok", "prince"]); // "restaurant" dropped
  });

  it("keeps raw tokens when a name is entirely generic", () => {
    // "The Room" is all stopwords → don't collapse to nothing
    expect(normalizeName("The Room").length).toBeGreaterThan(0);
  });

  it("scores similar names high and different names low", () => {
    expect(nameSimilarity("Cantina Royal", "Royal Cantina Bar")).toBeCloseTo(1, 5); // reorder + generic
    expect(nameSimilarity("Jok Prince", "Jok Prince Congee")).toBeCloseTo(1, 5); // subset
    expect(nameSimilarity("Skyfall Rooftop", "Tep Bar")).toBeLessThan(NAME_SIM_FLOOR);
    expect(nameSimilarity("Cantina Royal", "Ramen House Zen")).toBeLessThan(NAME_SIM_FLOOR);
  });

  it("measures geographic distance", () => {
    expect(distanceMeters({ lat: 13.75, lng: 100.5 }, { lat: 13.7502, lng: 100.5001 })).toBeLessThan(75);
    expect(distanceMeters({ lat: 13.75, lng: 100.5 }, { lat: 13.8, lng: 100.55 })).toBeGreaterThan(1000);
  });
});

// ── the three required cases ─────────────────────────────────────────────────
describe("resolvePlaces — conservative merging", () => {
  it("MERGES the same place seen by two sources (different names, ~25m apart)", () => {
    const raws = [
      mk("google", "Cantina Royal", 13.75, 100.5),
      mk("foursquare", "Royal Cantina Bar", 13.7502, 100.5001, { scale: 10, rating: 9 }),
    ];
    const resolved = resolvePlaces(raws);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].sourceNames.sort()).toEqual(["foursquare", "google"]);
    expect(resolved[0].matchConfidence).toBeGreaterThan(0.5);
    expect(isSamePlace(raws[0], raws[1])).toBe(true);
  });

  it("does NOT merge two different places that are nearby (~35m) — proximity alone is not enough", () => {
    const raws = [
      mk("google", "Cantina Royal", 13.75, 100.5),
      mk("foursquare", "Ramen House Zen", 13.7503, 100.5001, { scale: 10 }),
    ];
    expect(distanceMeters(raws[0], raws[1])).toBeLessThan(75); // they ARE close
    const resolved = resolvePlaces(raws);
    expect(resolved).toHaveLength(2); // ...but different names → not merged
  });

  it("does NOT merge same-named places far apart (~7km) — name alone is not enough", () => {
    const raws = [
      mk("google", "Starbucks", 13.75, 100.5),
      mk("foursquare", "Starbucks", 13.8, 100.55, { scale: 10 }),
    ];
    expect(nameSimilarity(raws[0].name, raws[1].name)).toBe(1); // identical name
    const resolved = resolvePlaces(raws);
    expect(resolved).toHaveLength(2); // ...but far apart → not merged
  });

  it("keeps a single-source place valid but flags low cross-source confidence", () => {
    const resolved = resolvePlaces([mk("google", "Solo Spot", 13.75, 100.5)]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].sourceNames).toEqual(["google"]);
    expect(resolved[0].matchConfidence).toBeLessThan(0.5);
  });

  it("never merges two records from the SAME source", () => {
    // Two google records at the identical spot with the same name are still two
    // rows from one source → must not collapse into one cross-checked place.
    const resolved = resolvePlaces([
      mk("google", "Twin Cafe", 13.75, 100.5),
      mk("google", "Twin Cafe", 13.75, 100.5),
    ]);
    expect(resolved).toHaveLength(2);
  });
});

// ── on the real mock dataset ─────────────────────────────────────────────────
describe("resolvePlaces — on mock sources (no over-merge)", () => {
  it("resolves each mock EAT place to one cross-checked place across all 3 sources", () => {
    const srcs: SourceName[] = ["google", "foursquare", "reddit"];
    const raws = srcs.flatMap((s) => mockSearchNearby(s, "eat"));
    const resolved = resolvePlaces(raws);

    const eatCount = mockPlaces.filter((p) => p.category === "eat").length;
    expect(resolved).toHaveLength(eatCount); // no over-merge of nearby-but-different places
    for (const r of resolved) {
      expect(r.sources).toHaveLength(3);
      expect(new Set(r.sourceNames)).toEqual(new Set(srcs));
      expect(r.matchConfidence).toBe(1); // identical across sources
    }
  });
});

// ── demo output ──────────────────────────────────────────────────────────────
describe("resolved examples (per-source breakdown)", () => {
  it("prints 3 resolved places with their cross-source records", () => {
    const srcs: SourceName[] = ["google", "foursquare", "reddit"];
    const raws = srcs.flatMap((s) => mockSearchNearby(s, "eat"));
    const resolved = resolvePlaces(raws).slice(0, 3);

    const lines: string[] = [];
    for (const r of resolved) {
      lines.push(
        `\n▸ ${r.name}  (${r.category})  —  matchConfidence ${r.matchConfidence} · ${r.sourceNames.length} sources`,
      );
      for (const s of r.sources) {
        lines.push(
          `   ${s.sourceName.padEnd(11)} rating ${s.rating}/${s.ratingScaleMax}  ·  ${s.reviewCount} reviews  ·  id=${s.sourceId}`,
        );
      }
      expect(r.sources.length).toBeGreaterThan(0);
    }
    // eslint-disable-next-line no-console
    console.log(lines.join("\n"));
  });
});
