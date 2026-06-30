import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getMdxComponents } from "@/components/mdx";
import DestinationImage from "@/components/DestinationImage";
import Experiences from "@/components/experiences/Experiences";
import FeaturedAvailability from "@/components/experiences/FeaturedAvailability";
import ThemeScope from "@/components/theme/ThemeScope";
import { getDestination, getDestinationSlugs } from "@/lib/content";
import { getTheme } from "@/lib/theme";

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
  const theme = getTheme(dest.slug);

  return (
    <ThemeScope slug={dest.slug}>
      <article>
        {/* Themed, treated hero with title overlay */}
        <header className="relative isolate flex min-h-[20rem] flex-col justify-end overflow-hidden sm:min-h-[24rem]">
          <DestinationImage
            src={theme.heroImage}
            alt={theme.mood}
            sizes="100vw"
            priority
            className="absolute inset-0 -z-10 h-full w-full"
          />
          <div className="mx-auto w-full max-w-3xl px-6 pb-8 pt-24">
            <Link
              href="/#destinations"
              className="inline-flex min-h-[44px] items-center font-body text-sm font-medium text-white/85 hover:text-white"
            >
              ← All destinations
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {dest.flag}
              </span>
              <span className="font-body text-sm font-medium uppercase tracking-wider text-white/80">
                {dest.country}
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-white drop-shadow sm:text-5xl">
              {dest.title}
            </h1>
            <p className="mt-3 max-w-2xl font-body text-base leading-relaxed text-white/85 sm:text-lg">
              {dest.summary}
            </p>
            <Link
              href={`/plan?dest=${dest.slug}`}
              className="mt-5 inline-flex min-h-[48px] items-center rounded-pill bg-coral px-7 font-body text-base font-semibold text-white shadow-soft transition-transform duration-200 hover:scale-[1.03]"
            >
              Plan my {dest.title} trip →
            </Link>
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

      {/* Things to do — commercial experiences handoff (separate from the
          countdown's authoritative rules) */}
      <Experiences city={dest.slug} cityName={dest.title} />
      <FeaturedAvailability city={dest.slug} cityName={dest.title} />
      </article>
    </ThemeScope>
  );
}
