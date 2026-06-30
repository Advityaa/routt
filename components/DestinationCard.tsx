import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { DestinationMeta } from "@/lib/content";
import { getTheme, themeVars } from "@/lib/theme";

/**
 * Large, image-led destination card. A real photo fills the card, a bottom
 * scrim keeps the overlaid title/line readable, and a rating pill sits on the
 * image. Hover gently zooms the photo and lifts the card.
 */
export default function DestinationCard({ dest }: { dest: DestinationMeta }) {
  const theme = getTheme(dest.slug);
  const line = theme.blurb ?? dest.tagline;

  return (
    <Link
      href={`/${dest.slug}`}
      style={themeVars(theme)}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[18px] shadow-soft transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lift"
    >
      {/* Photo (themed gradient fallback behind) */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-deep))" }}
      >
        <Image
          src={theme.heroImage}
          alt={theme.mood}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,18,30,0.05) 30%, rgba(8,18,30,0.35) 60%, rgba(8,18,30,0.82) 100%)",
          }}
        />
      </div>

      {/* Rating / editorial pill */}
      {theme.rating ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1 font-body text-xs font-semibold text-white backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
          {theme.rating.toFixed(1)}
          {theme.badge ? <span className="font-medium text-white/80">· {theme.badge}</span> : null}
        </span>
      ) : null}

      {/* Overlaid title block */}
      <div className="relative p-5">
        <span className="font-body text-xs font-medium uppercase tracking-wider text-white/75">
          {dest.flag} {dest.country}
        </span>
        <h3 className="mt-1 font-display text-2xl font-semibold leading-tight text-white drop-shadow">
          {dest.title}
        </h3>
        <p className="mt-1 font-body text-sm leading-snug text-white/85">{line}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-white">
          Explore
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
