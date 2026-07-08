import Link from "next/link";
import type { Category, CredibilityVerdict, PlacePhoto as PlacePhotoType } from "@/lib/types";
import VerdictBadge from "./VerdictBadge";
import PlacePhoto from "./PlacePhoto";

/**
 * PlaceCard — one entry in the short ranked feed.
 *
 * Priority order (per product spec): the VERDICT is the hero and leads the
 * card; then name / category / neighborhood / distance; then cost + a
 * busy-now indicator. DESIGN RULE — the photo SUPPORTS the verdict, never
 * replaces it: a small warm thumbnail on the right edge, never a hero. No
 * photo → palette placeholder.
 */
const CATEGORY_LABEL: Record<Category, string> = {
  eat: "Eat",
  drink: "Drink",
  shop: "Shop",
  see: "See",
};

export interface PlaceCardProps {
  rank?: number;
  name: string;
  category: Category;
  verdict: CredibilityVerdict;
  reason: string;
  neighborhood?: string;
  distance?: string; // e.g. "450 m"
  cost?: string; // home-currency estimate, e.g. "~$3 / bowl"
  busy?: "busy" | "quiet";
  href?: string;
  photo?: PlacePhotoType;
  /** Number of sources this place was cross-checked across (trust cue). */
  sourcesCount?: number;
}

export default function PlaceCard({
  rank,
  name,
  category,
  verdict,
  reason,
  neighborhood,
  distance,
  cost,
  busy,
  href,
  photo,
  sourcesCount,
}: PlaceCardProps) {
  const meta = [CATEGORY_LABEL[category], neighborhood, distance].filter(Boolean).join(" · ");
  // Honest cue: only claim a cross-check when there IS one (2+ sources).
  const trustCue =
    sourcesCount && sourcesCount > 1
      ? `checked across ${sourcesCount} sources`
      : sourcesCount === 1
        ? "single source"
        : null;

  const body = (
    <article className="flex gap-3.5 rounded-card border border-line bg-surface p-4 transition group-hover:border-fg/25">
      {rank !== undefined ? (
        <div className="pt-0.5 font-mono text-[13px] font-medium tabular-nums text-faint">
          {String(rank).padStart(2, "0")}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {/* 1 — the hero: verdict + reason */}
        <VerdictBadge verdict={verdict} reason={reason} />

        {/* 2 — name + category/neighborhood/distance, with a small supporting
               thumbnail on the right (never dominates; verdict stays the lead) */}
        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-display-sm font-semibold text-fg">{name}</h3>
            <div className="mt-1 text-eyebrow uppercase text-muted">{meta}</div>
          </div>
          <PlacePhoto
            photo={photo}
            alt={photo ? name : ""}
            sizes="72px"
            className="h-[64px] w-[72px] shrink-0 rounded-badge border border-line"
          />
        </div>

        {/* 3 — cost + busy-now */}
        {cost || busy ? (
          <div className="mt-3 flex items-center justify-between font-mono text-[12px]">
            <span className="text-muted">{cost}</span>
            {busy ? (
              <span className={busy === "busy" ? "text-fg" : "text-faint"}>
                {busy === "busy" ? "Busy now" : "Quiet now"}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* 4 — compact trust cue: the cross-check is visible before tapping in */}
        {trustCue ? (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-faint">
            <svg width="11" height="11" viewBox="0 0 13 13" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2.5 6.8 L5.3 9.5 L10.5 3.5" />
            </svg>
            {trustCue}
          </div>
        ) : null}
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="group block">
      {body}
    </Link>
  ) : (
    body
  );
}
