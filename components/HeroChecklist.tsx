"use client";

import Link from "next/link";
import { useState } from "react";
import Checklist from "./Checklist";
import type { DestinationMeta } from "@/lib/content";

/**
 * The signature moment. Tap a destination chip and the first-trip checklist
 * updates live. This is the one memorable interaction on the page — kept
 * deliberately uncluttered so nothing competes with it.
 */
export default function HeroChecklist({
  destinations,
}: {
  destinations: DestinationMeta[];
}) {
  const [activeSlug, setActiveSlug] = useState(destinations[0]?.slug ?? "");
  const active =
    destinations.find((d) => d.slug === activeSlug) ?? destinations[0];

  if (!active) return null;

  return (
    <div className="rounded-card border border-hairline bg-white/80 p-6 shadow-lift sm:p-8">
      <div className="mb-5 flex flex-wrap gap-2">
        {destinations.map((d) => {
          const isActive = d.slug === active.slug;
          return (
            <button
              key={d.slug}
              type="button"
              onClick={() => setActiveSlug(d.slug)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-pill border px-3.5 py-1.5 font-body text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-hairline bg-fill/40 text-ink/70 hover:border-primary/40"
              }`}
            >
              <span aria-hidden>{d.flag}</span>
              {d.title}
            </button>
          );
        })}
      </div>

      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">
          Your first {active.title} trip
        </h2>
        <Link
          href={`/${active.slug}`}
          className="font-body text-sm font-semibold text-primary hover:text-navy"
        >
          Full playbook →
        </Link>
      </div>
      <p className="mb-4 font-body text-sm text-ink/55">
        Tick these off before you go.
      </p>

      <Checklist items={active.checklist} replayKey={active.slug} />
    </div>
  );
}
