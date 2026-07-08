import type { PlaceSource } from "./types";
import { googleSource } from "./google";
import { foursquareSource } from "./foursquare";
import { redditSource } from "./reddit";

/**
 * The active set of place sources. Order matters: google is primary (its record
 * supplies the canonical id + descriptive fields at merge). Add/remove a source
 * here and nothing else in the app changes.
 */
export const sources: PlaceSource[] = [googleSource, foursquareSource, redditSource];

export const sourceByName = new Map<string, PlaceSource>(sources.map((s) => [s.name, s]));

export * from "./types";
export {
  mergeCluster,
  normalizeRating,
  agreementFromRatings,
  computeCrossSourceAgreement,
} from "./normalize";
