import "./guard";
import type { Category, Place, SourceName } from "../../types";
import { resolvePlaces } from "../../resolve";
import { mergeCluster } from "../normalize";
import { mockSearchNearby, mockGetDetails } from "../mockData";
import { googleSource } from "./google";
import { foursquareSource } from "./foursquare";
import { corroborateOnReddit, redditAsDetails } from "./reddit";
import { configuredSources } from "./env";
import { cached, areaKey, DAY_MS } from "./cache";

/**
 * Server-side orchestration for one area/category. This is the ONLY place real
 * API keys are touched. Runs behind /api/places (never imported by the client).
 *
 *   REAL: Google + Foursquare discover & resolve; Reddit corroborates by NAME
 *         (mentions + sentiment) as a low-weight extra source.
 *   MOCK: the mock adapters (google/foursquare/reddit) exactly as the client's
 *         offline pipeline — so /api/places?live=0 is a like-for-like compare.
 */

const CONSULTED_SOURCES = 3; // google + foursquare + reddit

async function realArea(category: Category, lat: number, lng: number): Promise<Place[]> {
  // Discovery + resolve across the two geo sources.
  const [g, f] = await Promise.all([
    googleSource.searchNearby(category, lat, lng),
    foursquareSource.searchNearby(category, lat, lng),
  ]);
  const resolved = resolvePlaces([...g, ...f]);

  return Promise.all(
    resolved.map(async (rp) => {
      const details = await Promise.all(
        rp.sources.map((m) =>
          (m.sourceName === "foursquare" ? foursquareSource : googleSource).getDetails(m.sourceId),
        ),
      );
      // Reddit corroboration by name (locals' take), added as a light source.
      const reddit = redditAsDetails(await corroborateOnReddit(rp.name), rp.name);
      if (reddit) details.push(reddit);
      return mergeCluster(rp, details, CONSULTED_SOURCES);
    }),
  );
}

function mockArea(category: Category, lat: number, lng: number): Place[] {
  const names: SourceName[] = ["google", "foursquare", "reddit"];
  const resolved = resolvePlaces(names.flatMap((s) => mockSearchNearby(s, category)));
  return resolved.map((rp) => {
    const details = rp.sources.map((m) => mockGetDetails(m.sourceName, m.sourceId));
    return mergeCluster(rp, details, names.length);
  });
}

export type SourceMode = "real" | "mock";

/** Resolve one area/category (cached 24h). */
export async function resolveArea(
  mode: SourceMode,
  category: Category,
  lat: number,
  lng: number,
): Promise<Place[]> {
  return cached(areaKey(mode, category, lat, lng), DAY_MS, () =>
    mode === "real" ? realArea(category, lat, lng) : mockArea(category, lat, lng),
  );
}

export { configuredSources };
