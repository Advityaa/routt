/**
 * Contextual affiliate link. rel="sponsored" for honesty + SEO correctness.
 * Surfaced inside relevant content (e.g. Arrival essentials), never as ads.
 */
export interface AffiliateLinkProps {
  href: string;
  label: string;
  sub?: string;
}

export default function AffiliateLink({ href, label, sub }: AffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-card border border-line bg-elevate px-4 py-3 transition hover:border-fg/25"
    >
      <div className="min-w-0">
        <div className="font-sans text-[14px] font-semibold text-fg">{label}</div>
        {sub ? <div className="mt-0.5 text-[12px] text-muted">{sub}</div> : null}
      </div>
      <span className="shrink-0 font-mono text-[13px] text-muted">↗</span>
    </a>
  );
}
