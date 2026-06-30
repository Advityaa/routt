import Link from "next/link";
import DestinationImage from "@/components/DestinationImage";
import type { DestinationMeta } from "@/lib/content";
import { getTheme, themeVars } from "@/lib/theme";

/**
 * Card on the landing grid. A real treated destination photo with a readable
 * scrim, themed to that destination's accent, lifting ~6px on hover.
 */
export default function DestinationCard({ dest }: { dest: DestinationMeta }) {
  const theme = getTheme(dest.slug);

  return (
    <Link
      href={`/${dest.slug}`}
      style={themeVars(theme)}
      className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-white shadow-soft transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="relative">
        <DestinationImage
          src={theme.heroImage}
          alt={theme.mood}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="aspect-[16/10] w-full"
        />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <h3 className="font-display text-2xl font-semibold text-white drop-shadow">
            {dest.title}
          </h3>
          <span className="rounded-pill bg-white/15 px-2.5 py-0.5 font-body text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            {dest.flag} {dest.country}
          </span>
        </div>
      </div>

      <div className="flex grow flex-col p-6">
        <p className="grow font-body text-sm leading-relaxed text-ink/60">
          {dest.tagline}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 font-body text-sm font-semibold accent-text">
          Read the playbook
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
