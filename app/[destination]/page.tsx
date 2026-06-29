import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getMdxComponents } from "@/components/mdx";
import { getDestination, getDestinationSlugs } from "@/lib/content";

interface PageProps {
  params: { destination: string };
}

/** Pre-render every playbook at build time (SSG). */
export function generateStaticParams() {
  return getDestinationSlugs().map((destination) => ({ destination }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const dest = getDestination(params.destination);
  if (!dest) return {};
  return {
    title: `${dest.title} — Routt first-trip playbook`,
    description: dest.summary,
  };
}

export default function DestinationPage({ params }: PageProps) {
  const dest = getDestination(params.destination);
  if (!dest) notFound();

  return (
    <article>
      {/* Playbook header */}
      <header className="border-b border-hairline bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href="/#destinations"
            className="font-body text-sm font-medium text-primary hover:text-navy"
          >
            ← All destinations
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <span className="text-4xl" aria-hidden>
              {dest.flag}
            </span>
            <span className="font-body text-sm font-medium uppercase tracking-wider text-primary/70">
              {dest.country}
            </span>
          </div>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">
            {dest.title}
          </h1>
          <p className="mt-4 font-body text-lg leading-relaxed text-ink/65">
            {dest.summary}
          </p>
        </div>
      </header>

      {/* Playbook body */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <MDXRemote
          source={dest.content}
          components={getMdxComponents(dest.slug)}
        />

        <p className="mt-12 rounded-card border border-hairline bg-fill/40 px-5 py-4 font-body text-xs leading-relaxed text-ink/55">
          Some links above are affiliate links — if you sign up through them we
          may earn a commission at no extra cost to you. It never changes what we
          recommend. See our full disclosure in the footer.
        </p>
      </div>
    </article>
  );
}
