import type { Metadata } from "next";
import Breadcrumbs from "@/components/guides/Breadcrumbs";
import JsonLd from "@/components/guides/JsonLd";
import PillarCard from "@/components/guides/PillarCard";
import { getAllPillars, getClusters } from "@/lib/guides";
import { breadcrumbSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides — first international trips from India | Routt",
  description:
    "Honest, India-first guides for your first trip abroad: visas, cash, eSIMs, forex cards and how to avoid the rookie tax. Built around real questions, not generic travel tips.",
  alternates: { canonical: absoluteUrl("/guides") },
};

export default function GuidesIndexPage() {
  const pillars = getAllPillars();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
        Guides for your first trip abroad
      </h1>
      <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-ink/65">
        No fluff, no generic &ldquo;travel tips&rdquo; — just the specific,
        India-first questions first-timers actually search for, answered
        honestly. Each guide links straight into a personalised{" "}
        <span className="font-semibold text-navy">Routt countdown</span> for your
        trip.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.url}
            pillar={pillar}
            clusterCount={getClusters(pillar.pillarSlug).length}
          />
        ))}
      </div>
    </div>
  );
}
