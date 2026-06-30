import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Breadcrumbs from "@/components/guides/Breadcrumbs";
import JsonLd from "@/components/guides/JsonLd";
import RelatedGuides from "@/components/guides/RelatedGuides";
import { getGuideMdxComponents } from "@/components/guides/mdx";
import DestinationImage from "@/components/DestinationImage";
import ThemeScope from "@/components/theme/ThemeScope";
import {
  getAllClusterParams,
  getCluster,
  getPillar,
  getRelated,
} from "@/lib/guides";
import { articleSchema, breadcrumbSchema, faqSchema, guideMetadata } from "@/lib/seo";
import { getTheme } from "@/lib/theme";

interface PageProps {
  params: { pillar: string; cluster: string };
}

export function generateStaticParams() {
  return getAllClusterParams();
}

export function generateMetadata({ params }: PageProps): Metadata {
  const post = getCluster(params.pillar, params.cluster);
  return post ? guideMetadata(post) : {};
}

export default function ClusterPage({ params }: PageProps) {
  const post = getCluster(params.pillar, params.cluster);
  const pillar = getPillar(params.pillar);
  if (!post || !pillar) notFound();

  const related = getRelated(post);
  const theme = getTheme(post.themeSlug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: pillar.title, path: pillar.url },
    { name: post.title, path: post.url },
  ];

  return (
    <ThemeScope slug={post.themeSlug}>
      <JsonLd data={articleSchema(post)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {post.faq?.length ? <JsonLd data={faqSchema(post.faq)} /> : null}

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
          <p className="font-body text-sm text-white/85">
            <span className="opacity-80">Part of: </span>
            <Link href={pillar.url} className="font-semibold text-white underline-offset-2 hover:underline">
              {pillar.title}
            </Link>
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.12] text-white drop-shadow sm:text-[2.6rem]">
            {post.title}
          </h1>
          <p className="mt-2 font-body text-sm text-white/80">
            Last reviewed {post.lastUpdated} · {post.author}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-6 py-10">
        <div className="guide-prose">
          <MDXRemote
            source={post.content}
            components={getGuideMdxComponents(post.slug)}
          />
        </div>

        {/* Visible FAQ (mirrors the FAQPage schema) */}
        {post.faq?.length ? (
          <section className="mt-12 border-t border-hairline pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Common questions
            </h2>
            <dl className="mt-5 space-y-5">
              {post.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-body text-base font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1.5 font-body text-[17px] leading-relaxed text-ink/75">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <RelatedGuides posts={related} />
      </article>
    </ThemeScope>
  );
}
