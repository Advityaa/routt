import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Pillar–cluster (hub-and-spoke) content model.
 *
 *   content/guides/<pillar>/index.mdx      → the pillar page (cluster: false)
 *   content/guides/<pillar>/<slug>.mdx     → a cluster post (cluster: true)
 *
 * Pillar links down to every cluster; clusters link up to the pillar and
 * sideways to siblings. All of that interlinking is derived here so it can't
 * fall out of sync or leave orphans.
 */

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

export interface GuideFrontmatter {
  title: string;
  metaDescription: string;
  slug: string;
  /** Pillar slug this post belongs to (a pillar's own pillar = its slug). */
  pillar: string;
  cluster: boolean;
  targetKeyword: string;
  lastUpdated: string; // YYYY-MM-DD
  author: string;
  relatedSlugs?: string[];
  /** Optional destination slug to theme this post (accent + hero photo). */
  themeSlug?: string;
  /** Short teaser for cards / related blocks. */
  summary?: string;
  /** Optional Q&A — drives the FAQPage schema + a visible FAQ block. */
  faq?: { q: string; a: string }[];
}

export interface GuideHeading {
  level: number; // 2 or 3
  text: string;
  id: string;
}

export interface GuidePost extends GuideFrontmatter {
  /** Directory name = pillar slug. */
  pillarSlug: string;
  /** Raw MDX body. */
  content: string;
  /** Canonical path, e.g. /guides/first-international-trip/dubai-visa-for-indians. */
  url: string;
  headings: GuideHeading[];
}

/** Slug used for heading ids + the in-post table of contents. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[*_`]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHeadings(md: string): GuideHeading[] {
  const out: GuideHeading[] = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const text = m[2].replace(/[*_`]/g, "").trim();
      out.push({ level: m[1].length, text, id: slugify(text) });
    }
  }
  return out;
}

function pillarSlugs(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function readPost(pillarSlug: string, fileBase: string): GuidePost | null {
  const file = path.join(GUIDES_DIR, pillarSlug, `${fileBase}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const fm = data as GuideFrontmatter;
  const isPillar = fileBase === "index";
  const slug = isPillar ? pillarSlug : fileBase;
  const url = isPillar
    ? `/guides/${pillarSlug}`
    : `/guides/${pillarSlug}/${fileBase}`;

  return {
    ...fm,
    slug,
    pillar: pillarSlug,
    cluster: !isPillar,
    pillarSlug,
    content,
    url,
    headings: extractHeadings(content),
  };
}

/** The pillar page for a directory. */
export function getPillar(pillarSlug: string): GuidePost | null {
  return readPost(pillarSlug, "index");
}

/** Every pillar, ordered as declared on disk. */
export function getAllPillars(): GuidePost[] {
  return pillarSlugs()
    .map((p) => getPillar(p))
    .filter((p): p is GuidePost => p !== null);
}

/** Cluster posts under a pillar (everything except index.mdx). */
export function getClusters(pillarSlug: string): GuidePost[] {
  const dir = path.join(GUIDES_DIR, pillarSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && f !== "index.mdx")
    .map((f) => readPost(pillarSlug, f.replace(/\.mdx$/, "")))
    .filter((p): p is GuidePost => p !== null);
}

export function getCluster(
  pillarSlug: string,
  clusterSlug: string
): GuidePost | null {
  const post = readPost(pillarSlug, clusterSlug);
  return post && post.cluster ? post : null;
}

/**
 * Related siblings for a cluster: its declared relatedSlugs first, then other
 * clusters in the same pillar — so no post is ever a dead end.
 */
export function getRelated(post: GuidePost, limit = 3): GuidePost[] {
  const siblings = getClusters(post.pillarSlug).filter((c) => c.slug !== post.slug);
  const ordered: GuidePost[] = [];
  for (const wanted of post.relatedSlugs ?? []) {
    const match = siblings.find((s) => s.slug === wanted);
    if (match && !ordered.includes(match)) ordered.push(match);
  }
  for (const s of siblings) {
    if (ordered.length >= limit) break;
    if (!ordered.includes(s)) ordered.push(s);
  }
  return ordered.slice(0, limit);
}

/** All cluster route params, for generateStaticParams + the sitemap. */
export function getAllClusterParams(): { pillar: string; cluster: string }[] {
  return pillarSlugs().flatMap((pillar) =>
    getClusters(pillar).map((c) => ({ pillar, cluster: c.slug }))
  );
}
