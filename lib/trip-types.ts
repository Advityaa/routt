import type { PartnerId } from "./affiliate";

/**
 * Shared types for the countdown. Kept free of any Node/fs imports so client
 * components can import them without pulling the JSON loader into the bundle.
 */

export type TaskCategory =
  | "visa"
  | "passport"
  | "insurance"
  | "money"
  | "connectivity"
  | "apps"
  | "arrival";

/** Where a task hands the user off. Visa/passport are ALWAYS authoritative. */
export type HandoffType = "authoritative" | "commercial" | "informational";

/**
 * Honest expectation ranges for time-sensitive / cost items (esp. visa).
 * Always ranges, never a single asserted figure.
 */
export interface FactRanges {
  standardProcessing?: string;
  expressProcessing?: string;
  feeRangeINR?: string;
  applyAheadRecommendation?: string;
}

export interface TripTask {
  id: string;
  category: TaskCategory;
  title: string;
  /** The migrated, verified value content. May be multi-sentence. */
  why: string;
  /** Start-by lead time in days before departure — drives the urgency math. */
  leadTimeDays: number;
  /** Human sequencing note for the data pass. NOT shown to the user. */
  urgencyRule?: string;
  handoffType: HandoffType;
  handoffLabel?: string | null;
  /** Authoritative/informational link target. Commercial uses partnerId instead. */
  handoffURL?: string | null;
  /** Commercial handoff → resolves against lib/affiliate.ts (central link map). */
  partnerId?: PartnerId;
  /** Always false — the product never asserts a volatile outcome. */
  assert: false;
  /** Shown to the user as "what to expect" — ranges, not quotes. */
  factsRange?: FactRanges;
}

export interface ReferenceTable {
  label: string;
  rows: { label: string; value: string }[];
  note?: string;
}

export interface TripDestination {
  slug: string;
  city?: string;
  title: string;
  country: string;
  flag: string;
  fromPassport?: string;
  /** e.g. "2026-06" — presence means human-verified. */
  lastReviewed?: string;
  /** Internal note on data confidence + re-verify cadence. Not user-facing. */
  reviewNote?: string;
  /** Optional destination-specific heads-up shown atop the countdown. */
  note?: string;
  tasks: TripTask[];
  reference?: ReferenceTable;
}

/** One row in the destination dropdown. */
export interface CatalogueEntry {
  slug: string;
  title: string;
  flag: string;
  country: string;
  /** True when we have verified JSON data and can render a live plan. */
  live: boolean;
}
