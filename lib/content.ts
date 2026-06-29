import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "destinations");

/** Frontmatter every destination playbook must declare. */
export interface DestinationFrontmatter {
  title: string;
  country: string;
  /** Emoji flag, shown on cards + hero. */
  flag: string;
  summary: string;
  /** One-line hook used on the destination card. */
  tagline: string;
  /** Ordering on the landing grid (lower = first). */
  order: number;
  /**
   * The 4–6 first-trip to-dos shown live in the landing hero checklist when
   * this destination is selected. Kept in frontmatter so writers own it.
   */
  checklist: string[];
}

export interface DestinationMeta extends DestinationFrontmatter {
  slug: string;
}

export interface Destination extends DestinationMeta {
  /** Raw MDX body (everything below the frontmatter). */
  content: string;
}

function readFileForSlug(slug: string): Destination | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as DestinationFrontmatter;

  return { slug, content, ...fm };
}

/** Every playbook slug, derived from the .mdx filenames. */
export function getDestinationSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/** Metadata for the landing grid + hero, sorted by `order`. */
export function getAllDestinations(): DestinationMeta[] {
  return getDestinationSlugs()
    .map((slug) => readFileForSlug(slug))
    .filter((d): d is Destination => d !== null)
    .sort((a, b) => a.order - b.order)
    .map(({ content, ...meta }) => meta);
}

/** Full playbook (meta + MDX body) for a single route. */
export function getDestination(slug: string): Destination | null {
  return readFileForSlug(slug);
}
