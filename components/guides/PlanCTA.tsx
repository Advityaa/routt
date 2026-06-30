import Link from "next/link";

/**
 * The money move: every guide routes the reader into the real product instead
 * of dead-ending. "Planning this trip? Routt builds you a countdown → /plan".
 */
export default function PlanCTA({ dest, city }: { dest?: string; city?: string }) {
  const href = dest ? `/plan?dest=${dest}` : "/plan";
  return (
    <aside className="not-prose my-8 rounded-card border border-hairline bg-navy px-6 py-7 shadow-soft">
      <p className="font-display text-2xl font-semibold text-white">
        {city ? `Planning a ${city} trip?` : "Planning your first trip?"}
      </p>
      <p className="mt-2 font-body text-base leading-relaxed text-white/75">
        Routt turns all of this into a personalised, date-anchored countdown —
        what to sort, when to sort it, and exactly where to do each thing.
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-[48px] items-center rounded-pill bg-coral px-7 font-body text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
      >
        Build my countdown →
      </Link>
    </aside>
  );
}
