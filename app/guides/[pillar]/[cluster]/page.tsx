import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Breadcrumbs from "@/components/guides/Breadcrumbs";
import JsonLd from "@/components/guides/JsonLd";
import RelatedGuides from "@/components/guides/RelatedGuides";
import { getGuideMdxComponents } from "@/components/guides/mdx";
import {
  getAllClusterParams,
  getCluster,
  getPillar,
  getRelated,
} from "@/lib/guides";
import { articleSchema, breadcrumbSchema, faqSchema, guideMetadata } from "@/lib/seo";

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
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: pillar.title, path: pillar.url },
    { name: post.title, path: post.url },
  ];

  return (
    <article className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
      <JsonLd data={articleSchema(post)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      {post.faq?.length ? <JsonLd data={faqSchema(post.faq)} /> : null}

      <Breadcrumbs crumbs={crumbs} />

      {/* Up-link to the pillar (spoke → hub) with descriptive anchor text */}
      <p className="mt-5 font-body text-sm">
        <span className="text-ink/50">Part of: </span>
        <Link href={pillar.url} className="font-semibold text-primary hover:text-navy">
          {pillar.title}
        </Link>
      </p>

      <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.12] text-ink sm:text-[2.75rem]">
        {post.title}
      </h1>
      <p className="mt-3 font-body text-sm text-ink/45">
        Last reviewed {post.lastUpdated} · {post.author}
      </p>

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
  );
}
