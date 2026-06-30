/** Canonical site origin, used for absolute URLs (OG tags, sitemap, JSON-LD). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://routt.app"
).replace(/\/$/, "");

export const SITE_NAME = "Routt";

/** Absolute URL for a path like "/guides/...". */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
