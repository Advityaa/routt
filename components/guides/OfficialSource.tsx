"use client";

import { trackHandoffClick } from "@/lib/affiliate";

/**
 * Authoritative handoff for volatile/risky facts (esp. visa). Neutral style,
 * NEVER an affiliate — same trust rule as the countdown. Tracked separately
 * from affiliate clicks.
 */
export default function OfficialSource({
  href,
  label,
  category = "visa",
  destination = "guides",
}: {
  href: string;
  label: string;
  category?: string;
  destination?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackHandoffClick({ type: "authoritative", category, destination })}
      className="not-prose my-4 inline-flex min-h-[48px] items-center gap-2 rounded-pill border border-navy bg-white px-6 font-body text-sm font-semibold text-navy transition-colors hover:bg-fill/50"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
      {label} <span aria-hidden>↗</span>
    </a>
  );
}
