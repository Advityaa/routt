import type { CredibilityVerdict } from "@/lib/types";

/**
 * VerdictBadge — Routt's signature element.
 *
 * Leads every place card. Color-coded AND shape-coded (the mark differs per
 * verdict) so the signal survives color-blindness and bright sunlight — never
 * relying on hue alone. The credibility `reason` renders in mono beneath, so it
 * reads like verified evidence, not marketing.
 *
 * Colors live in app/globals.css (.verdict-badge[data-verdict=…]) so the badge
 * themes itself in dark/light with no prop changes.
 */

const LABEL: Record<CredibilityVerdict, string> = {
  "still-good": "Still good",
  fading: "Fading",
  "tourist-trap": "Tourist trap",
  unrated: "Not rated yet",
  mixed: "Mixed reports",
};

/** Distinct mark per verdict: check (alive) / down-arrow (declining) / alert. */
function Mark({ verdict, px = 13 }: { verdict: CredibilityVerdict; px?: number }) {
  const common = {
    width: px,
    height: px,
    viewBox: "0 0 13 13",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (verdict === "still-good") {
    return (
      <svg {...common}>
        <path d="M2.5 6.8 L5.3 9.5 L10.5 3.5" />
      </svg>
    );
  }
  if (verdict === "fading") {
    return (
      <svg {...common}>
        <path d="M6.5 2 V10" />
        <path d="M3 6.5 L6.5 10 L10 6.5" />
      </svg>
    );
  }
  if (verdict === "tourist-trap") {
    // caution triangle with a bang
    return (
      <svg {...common}>
        <path d="M6.5 2 L11.5 10.5 L1.5 10.5 Z" />
        <path d="M6.5 5.4 V7.6" />
        <path d="M6.5 9.1 v0.01" />
      </svg>
    );
  }
  if (verdict === "mixed") {
    // mixed — opposing half-arrows (reports point both ways)
    return (
      <svg {...common}>
        <path d="M2.5 4.5 h8 M8.5 2.5 l2 2 -2 2" />
        <path d="M10.5 8.5 h-8 M4.5 6.5 l-2 2 2 2" />
      </svg>
    );
  }
  // unrated — neutral hollow circle (no judgement yet)
  return (
    <svg {...common}>
      <circle cx="6.5" cy="6.5" r="4.3" />
    </svg>
  );
}

export interface VerdictBadgeProps {
  verdict: CredibilityVerdict;
  /** One-line credibility reasoning, e.g. "40+ recent local reviews, steady 6 months". */
  reason?: string;
  size?: "sm" | "md" | "lg";
  /** Hide the reasoning subtext (badge only). */
  showReason?: boolean;
  className?: string;
}

const MARK_PX: Record<NonNullable<VerdictBadgeProps["size"]>, number> = {
  sm: 12,
  md: 13,
  lg: 16,
};

export default function VerdictBadge({
  verdict,
  reason,
  size = "md",
  showReason = true,
  className = "",
}: VerdictBadgeProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span
        className="verdict-badge animate-badge-in self-start"
        data-verdict={verdict}
        data-size={size}
        role="status"
        aria-label={`Credibility verdict: ${LABEL[verdict]}${reason ? `. ${reason}` : ""}`}
      >
        <Mark verdict={verdict} px={MARK_PX[size]} />
        {LABEL[verdict]}
      </span>
      {showReason && reason ? (
        <p className="font-mono text-[11.5px] leading-snug text-muted">{reason}</p>
      ) : null}
    </div>
  );
}
