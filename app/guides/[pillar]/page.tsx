import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Breadcrumbs from "@/components/guides/Breadcrumbs";
import JsonLd from "@/components/guides/JsonLd";
import TableOfContents from "@/components/guides/TableOfContents";
import { getGuideMdxComponents } from "@/components/guides/mdx";
import DestinationImage from "@/components/DestinationImage";
import ThemeScope from "@/components/theme/ThemeScope";
import { getAllPillars, getClusters, getPillar } from "@/lib/guides";
import { articleSchema, breadcrumbSchema, faqSchema, guideMetadata } from "@/lib/seo";
import { getTheme } from "@/lib/theme";

interface PageProps {
  params: { pillar: string };
}

export function generateStaticParams() {
  return getAllPillars().map((p) => ({ pillar: p.pillarSlug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const pillar = getPillar(params.pillar);
  return pillar ? guideMetadata(pillar) : {};
}

export default function PillarPage({ params }: PageProps) {
  const pillar = getPillar(params.pillar);
  if (!pillar) notFound();

  const clusters = getClusters(pillar.pillarSlug);
  const theme = getTheme(pillar.themeSlug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: pillar.title, path: pillar.url },
  ];

  return (
    <ThemeScope slug={pillar.themeSlug}>
      <JsonLd data={articleSchema(pillar)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {pillar.faq?.length ? <JsonLd data={faqSchema(pillar.faq)} /> : null}

      <div className="mx-auto max-w-2xl px-6 pt-8">
        <Breadcrumbs crumbs={crumbs} />
      </div>

      {/* Themed treated hero with the title overlaid */}
      <header className="relative isolate mt-4 flex min-h-[14rem] flex-col justify-end overflow-hidden sm:min-h-[17rem]">
        <DestinationImage
          src={theme.heroImage}
          alt={theme.mood}
          sizes="100vw"
          priority
          className="absolute inset-0 -z-10 h-full w-full"
        />
        <div className="mx-auto w-full max-w-2xl px-6 pb-7 pt-20">
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-white drop-shadow sm:text-5xl">
            {pillar.title}
          </h1>
          <p className="mt-2 font-body text-sm text-white/80">
            Last reviewed {pillar.lastUpdated} · {pillar.author}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-6 py-10">
        <TableOfContents headings={pillar.headings} />

        <div className="guide-prose">
          <MDXRemote
            source={pillar.content}
            components={getGuideMdxComponents(pillar.slug)}
          />
        </div>

        {/* Auto down-links: the pillar links to every cluster (hub → spokes) */}
        {clusters.length > 0 ? (
          <section className="mt-12 border-t border-hairline pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Guides in this series
            </h2>
            <ul className="mt-5 space-y-3">
              {clusters.map((c) => (
                <li key={c.url}>
                  <Link
                    href={c.url}
                    className="group flex flex-col rounded-card border border-hairline bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <span className="font-body text-base font-semibold text-ink group-hover:text-navy">
                      {c.title}
                    </span>
                    {c.summary ? (
                      <span className="mt-1 font-body text-sm leading-relaxed text-ink/60">
                        {c.summary}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </ThemeScope>
  );
}
