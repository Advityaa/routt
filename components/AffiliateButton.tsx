"use client";

import { getPartner, trackAffiliateClick, type PartnerId } from "@/lib/affiliate";

interface AffiliateButtonProps {
  /** Partner id from lib/affiliate.ts, e.g. "airalo". */
  partner: PartnerId;
  /** Slug of the playbook this button lives in — set by the page template. */
  destination: string;
  /** Optional label override; defaults to "Get <Partner>". */
  label?: string;
}

/**
 * The only way an affiliate link reaches the user. Fires a tracked
 * "affiliate_click" event, then navigates out in a new tab. Every outbound
 * click in the product flows through here so click-through rate is measurable.
 */
export default function AffiliateButton({
  partner,
  destination,
  label,
}: AffiliateButtonProps) {
  const data = getPartner(partner);

  return (
    <a
      href={data.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() => trackAffiliateClick({ partner: data, destination })}
      className="group not-prose my-3 flex flex-col gap-3 rounded-card border border-hairline bg-white px-5 py-4 no-underline shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <span className="flex min-w-0 flex-col">
        <span className="font-body text-base font-semibold text-ink">
          {data.name}
        </span>
        <span className="font-body text-sm text-ink/60">{data.blurb}</span>
      </span>
      <span className="flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-pill bg-coral px-5 py-2.5 text-center font-body text-sm font-semibold text-white transition-transform duration-200 group-hover:scale-[1.03] sm:w-auto">
        {label ?? `Get ${data.name}`}
      </span>
    </a>
  );
}
