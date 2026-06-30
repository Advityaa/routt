import Link from "next/link";
import type { GuidePost } from "@/lib/guides";

/** Foot-of-post block — keeps every page linked (no orphans) + aids crawling. */
export default function RelatedGuides({
  posts,
  heading = "Related guides",
}: {
  posts: GuidePost[];
  heading?: string;
}) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12 border-t border-hairline pt-8">
      <h2 className="font-display text-2xl font-semibold text-ink">{heading}</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {posts.map((p) => (
          <li key={p.url}>
            <Link
              href={p.url}
              className="group flex h-full flex-col rounded-card border border-hairline bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="font-body text-base font-semibold text-ink group-hover:text-navy">
                {p.title}
              </span>
              {p.summary ? (
                <span className="mt-1.5 font-body text-sm leading-relaxed text-ink/60">
                  {p.summary}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
