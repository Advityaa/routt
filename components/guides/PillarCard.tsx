import Link from "next/link";
import type { GuidePost } from "@/lib/guides";

/** A pillar on the /guides hub, with its cluster count. */
export default function PillarCard({
  pillar,
  clusterCount,
}: {
  pillar: GuidePost;
  clusterCount: number;
}) {
  return (
    <Link
      href={pillar.url}
      className="group flex h-full flex-col rounded-card border border-hairline bg-white p-6 shadow-soft transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <span className="font-body text-xs font-medium uppercase tracking-wider text-primary/70">
        Guide · {clusterCount} article{clusterCount === 1 ? "" : "s"}
      </span>
      <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
        {pillar.title}
      </h2>
      <p className="mt-2 grow font-body text-sm leading-relaxed text-ink/60">
        {pillar.summary ?? pillar.metaDescription}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary">
        Read the guide
        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}
