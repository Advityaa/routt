import type { Category } from "../types";
import type { RawSourcePlace, SourceName } from "../sources/types";
import { distanceMeters, nameSimilarity, isSamePlace, MATCH_RADIUS_M } from "./matching";

/**
 * Entity resolution: group RawSourcePlace records from every source into one
 * ResolvedPlace per real-world venue, carrying the per-source records it was
 * built from and a matchConfidence. Conservative by design (see matching.ts).
 */

export interface ResolvedPlace {
  /** Canonical id — inherits from the google member when present (stable ids). */
  id: string;
  name: string; // representative display name
  category: Category;
  lat: number;
  lng: number;
  /** The per-source records merged into this place (rating/reviewCount live here). */
  sources: RawSourcePlace[];
  /** Convenience: which sources matched (e.g. ["google","foursquare"]). */
  sourceNames: SourceName[];
  /** 0–1 — confidence that this is one correctly cross-checked place. */
  matchConfidence: number;
}

// A single source is valid but uncorroborated — nothing to cross-check against.
const SINGLE_SOURCE_CONFIDENCE = 0.4;
// Seed clusters from higher-priority sources first, so google (primary) supplies
// the canonical id + representative fields.
const SOURCE_PRIORITY: SourceName[] = ["google", "foursquare", "reddit"];
const priorityIndex = (s: SourceName) => {
  const i = SOURCE_PRIORITY.indexOf(s);
  return i === -1 ? SOURCE_PRIORITY.length : i;
};

interface Cluster {
  rep: RawSourcePlace;
  members: RawSourcePlace[];
}

/**
 * Confidence that a cluster is one correctly-merged place:
 *  • single source            → SINGLE_SOURCE_CONFIDENCE (valid, but no cross-check)
 *  • multi-source             → 0.55 + 0.45 · strength · corroboration
 *      strength      = 0.5·(worst name similarity) + 0.5·(1 − worst distance/RADIUS)
 *      corroboration = min(1, (#sources − 1) / 2)   // 2 sources → 0.5, 3+ → 1.0
 * So a 3-source near-identical match ≈ 1.0, a borderline 2-source match ≈ 0.65–0.75,
 * and a lone source sits well below any real merge — the ordering we want to show users.
 */
function computeConfidence(members: RawSourcePlace[], rep: RawSourcePlace): number {
  if (members.length === 1) return SINGLE_SOURCE_CONFIDENCE;
  let minSim = 1;
  let maxDist = 0;
  for (const m of members) {
    if (m === rep) continue;
    minSim = Math.min(minSim, nameSimilarity(rep.name, m.name));
    maxDist = Math.max(maxDist, distanceMeters(rep, m));
  }
  const strength = 0.5 * minSim + 0.5 * Math.max(0, 1 - maxDist / MATCH_RADIUS_M);
  const corroboration = Math.min(1, (members.length - 1) / 2);
  return Math.round((0.55 + 0.45 * strength * corroboration) * 100) / 100;
}

function toResolvedPlace(c: Cluster): ResolvedPlace {
  const rep = c.members.find((m) => m.sourceName === "google") ?? c.members[0];
  return {
    id: rep.sourceId,
    name: rep.name,
    category: rep.category,
    lat: rep.lat,
    lng: rep.lng,
    sources: c.members,
    sourceNames: c.members.map((m) => m.sourceName),
    matchConfidence: computeConfidence(c.members, rep),
  };
}

/**
 * Resolve raw place records from all sources into cross-checked ResolvedPlaces.
 * Greedy single pass: each record joins the best-matching existing cluster (both
 * proximity AND name floor satisfied), else seeds a new one. A record never joins
 * a cluster that already holds its own source — two records from one source are
 * different real places, never the same.
 */
export function resolvePlaces(rawPlaces: RawSourcePlace[]): ResolvedPlace[] {
  const ordered = [...rawPlaces].sort(
    (a, b) => priorityIndex(a.sourceName) - priorityIndex(b.sourceName),
  );
  const clusters: Cluster[] = [];

  for (const p of ordered) {
    let best: { cluster: Cluster; sim: number } | null = null;
    for (const c of clusters) {
      if (c.members.some((m) => m.sourceName === p.sourceName)) continue; // no same-source merge
      if (!isSamePlace(c.rep, p)) continue;
      const sim = nameSimilarity(c.rep.name, p.name);
      if (!best || sim > best.sim) best = { cluster: c, sim };
    }
    if (best) best.cluster.members.push(p);
    else clusters.push({ rep: p, members: [p] });
  }

  return clusters.map(toResolvedPlace);
}

export {
  distanceMeters,
  nameSimilarity,
  normalizeName,
  isSamePlace,
  MATCH_RADIUS_M,
  NAME_SIM_FLOOR,
  STRONG_RADIUS_M,
  STRONG_NAME_SIM,
} from "./matching";
