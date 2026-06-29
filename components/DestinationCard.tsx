import Link from "next/link";
import type { DestinationMeta } from "@/lib/content";

/**
 * Card on the landing grid. Soft shadow + 1px border, ~22px corners, lifts ~6px
 * on hover — the standard depth treatment used everywhere except the hero.
 */
export default function DestinationCard({ dest }: { dest: DestinationMeta }) {
  return (
    <Link
      href={`/${dest.slug}`}
      className="group flex flex-col rounded-card border border-hairline bg-white p-6 shadow-soft transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl" aria-hidden>
          {dest.flag}
        </span>
        <span className="font-body text-xs font-medium uppercase tracking-wider text-primary/70">
          {dest.country}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
        {dest.title}
      </h3>
      <p className="mt-2 grow font-body text-sm leading-relaxed text-ink/60">
        {dest.tagline}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary">
        Read the playbook
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  );
}
