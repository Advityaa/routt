import type { MetadataRoute } from "next";
import { getDestinationSlugs } from "@/lib/content";
import { getAllClusterParams, getAllPillars, getCluster } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (p: string) => `${SITE_URL}${p}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), priority: 1 },
    { url: url("/plan"), priority: 0.9 },
    { url: url("/guides"), priority: 0.8 },
  ];

  const playbooks: MetadataRoute.Sitemap = getDestinationSlugs().map((slug) => ({
    url: url(`/${slug}`),
    priority: 0.7,
  }));

  const pillars: MetadataRoute.Sitemap = getAllPillars().map((p) => ({
    url: url(p.url),
    lastModified: p.lastUpdated,
    priority: 0.8,
  }));

  const clusters: MetadataRoute.Sitemap = getAllClusterParams()
    .map(({ pillar, cluster }) => getCluster(pillar, cluster))
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => ({ url: url(c.url), lastModified: c.lastUpdated, priority: 0.7 }));

  return [...staticPages, ...playbooks, ...pillars, ...clusters];
}
