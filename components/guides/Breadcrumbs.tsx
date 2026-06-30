import Link from "next/link";
import type { Crumb } from "@/lib/seo";

/** Visual breadcrumb trail (Home > Guides > Pillar > Post). Good UX + SEO. */
export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-body text-sm text-ink/55">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-2">
              {last ? (
                <span className="text-ink/70" aria-current="page">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="hover:text-navy">
                  {c.name}
                </Link>
              )}
              {!last ? <span aria-hidden className="text-ink/30">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
