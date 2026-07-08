import type { ReviewOrigin } from "../types";
import type { RawReview } from "./types";

/**
 * ⚠️ FIRST-PASS local-vs-tourist classifier — THE WEAKEST LINK IN THE ENGINE.
 * =============================================================================
 * Real reviews arrive with NO local/tourist label. All tourist-trap detection
 * ultimately rests on this signal, and this heuristic is crude, English/Thai-
 * centric, and easily fooled. It is a PLACEHOLDER to unblock real data, NOT a
 * solution. It WILL be wrong on individuals; it's only meant to be roughly right
 * in aggregate. Do not trust it — iterate it. Better future signals:
 *   • reviewer history / home geo (best), if the source exposes it
 *   • account age + review cadence in-country
 *   • a trained classifier on labelled local/visitor reviews
 *
 * Output: localProbability ∈ [0,1]. Deliberately stays near 0.5 when unsure.
 */

// Phrasing that leans TOURIST (writing as a visitor passing through).
const TOURIST_CUES =
  /\b(tourist|on (my|our) (trip|holiday|vacation)|vacation|holiday|bucket[- ]?list|must[- ](see|visit|try|do)|first time in|while visiting|visiting bangkok|instagram|reel|tiktok|jet ?lag|our hotel|day trip|layover)\b/i;

// Phrasing that leans LOCAL (writing as someone who lives there / goes regularly).
const LOCAL_CUES =
  /\b(come here (often|regularly|weekly)|every (week|day)|my go[- ]?to|our regular|as a local|i live (nearby|here)|in my neighbou?rhood|local favou?rite|been coming for years)\b|ประจำ|แถวบ้าน|อร่อย|ร้านนี้/i;

/** Roughly infer P(local) for one raw review. See the file banner — this is weak. */
export function classifyLocalProbability(r: RawReview): number {
  let p = 0.5; // unknown by default

  // (1) Language — the strongest cheap signal for Bangkok. Thai ⇒ almost surely
  //     local; a non-English/non-Thai language ⇒ more likely a foreign visitor.
  const lang = (r.language || "").toLowerCase();
  if (lang.startsWith("th")) p += 0.35;
  else if (lang.startsWith("en") || lang === "" || lang === "und") p -= 0.05; // ambiguous
  else p -= 0.15; // other foreign language → leans visitor

  // (2) Phrasing cues (very noisy).
  if (TOURIST_CUES.test(r.text)) p -= 0.25;
  if (LOCAL_CUES.test(r.text)) p += 0.25;

  // (3) Author signal — placeholder. If a source ever gives us reviewer history
  //     or home geo, THIS should dominate. We don't have it yet.
  //     (r.authorId presence alone tells us nothing about local-ness.)

  return Math.max(0, Math.min(1, p));
}

/** Threshold a probability into the boolean the current engine consumes. */
export function originFromProbability(p: number): ReviewOrigin {
  return p >= 0.5 ? "local" : "tourist";
}
