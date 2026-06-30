import type { GuidePost } from "./guides";
import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

/**
 * JSON-LD builders. Pure objects — rendered into <script type="application/ld+json">
 * by the JsonLd component. Helps Google understand the article, its breadcrumb
 * trail, and any FAQ so it can show rich results.
 */

export interface Crumb {
  name: string;
  path: string;
}

export function articleSchema(post: GuidePost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.lastUpdated,
    dateModified: post.lastUpdated,
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(post.url) },
    inLanguage: "en-IN",
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** Shared <title>/description/OG/Twitter/canonical from a post's frontmatter. */
export function guideMetadata(post: GuidePost) {
  const url = absoluteUrl(post.url);
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article" as const,
      url,
      title: post.title,
      description: post.metaDescription,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: post.title,
      description: post.metaDescription,
    },
  };
}

export { SITE_URL };
