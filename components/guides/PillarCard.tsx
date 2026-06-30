import Link from "next/link";
import DestinationImage from "@/components/DestinationImage";
import type { GuidePost } from "@/lib/guides";
import { getTheme, themeVars } from "@/lib/theme";

/** A pillar on the /guides hub, with a themed treated image + cluster count. */
export default function PillarCard({
  pillar,
  clusterCount,
}: {
  pillar: GuidePost;
  clusterCount: number;
}) {
  const theme = getTheme(pillar.themeSlug);

  return (
    <Link
      href={pillar.url}
      style={themeVars(theme)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-white shadow-soft transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="relative">
        <DestinationImage
          src={theme.heroImage}
          alt={theme.mood}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="aspect-[16/9] w-full"
        />
        <span className="absolute bottom-3 left-4 rounded-pill bg-white/15 px-2.5 py-0.5 font-body text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
          Guide · {clusterCount} article{clusterCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex grow flex-col p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">
          {pillar.title}
        </h2>
        <p className="mt-2 grow font-body text-sm leading-relaxed text-ink/60">
          {pillar.summary ?? pillar.metaDescription}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 font-body text-sm font-semibold accent-text">
          Read the guide
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
