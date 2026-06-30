"use client";

import Link from "next/link";
import { useState } from "react";
import Checklist from "@/components/Checklist";
import DestinationImage from "@/components/DestinationImage";
import type { DestinationMeta } from "@/lib/content";
import { getTheme, themeVars } from "@/lib/theme";

/**
 * The home hero, themed live. Hovering or tapping a destination shifts the
 * accent + hero photo with a smooth transition; before any pick it's clean
 * Routt blue. The interactive checklist stays the focal point.
 *
 * The theme is an accent layer only — base brand (blue, coral, ink) is fixed.
 */
export default function HomeHero({ destinations }: { destinations: DestinationMeta[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeSlug = hovered ?? selected; // null = brand-blue default
  const theme = getTheme(activeSlug);
  const content =
    destinations.find((d) => d.slug === activeSlug) ?? destinations[0];

  return (
    <section
      style={themeVars(theme)}
      className="theme-transition relative overflow-hidden bg-bg"
    >
      {/* Destination photo behind the hero (only once a destination is active) */}
      {activeSlug && theme.heroImage ? (
        <div key={activeSlug} className="absolute inset-0 -z-10 animate-fade-in">
          <DestinationImage
            src={theme.heroImage}
            alt={theme.mood}
            sizes="100vw"
            scrim={false}
            priority
            className="h-full w-full"
          />
        </div>
      ) : null}

      {/* Legibility masks: keep the text side light. Desktop fades left→right,
          mobile fades top→bottom. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden sm:block"
        style={{
          background:
            "linear-gradient(to right, #FAFCFE 0%, rgba(250,252,254,0.92) 34%, rgba(250,252,254,0.35) 72%, rgba(250,252,254,0.1) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(250,252,254,0.94) 30%, rgba(250,252,254,0.74) 100%)",
        }}
      />

      {/* Faint themed ambient glow — the only glow in the product */}
      <div
        aria-hidden
        className="theme-transition pointer-events-none absolute -top-32 left-1/2 -z-10 h-[20rem] w-[20rem] -translate-x-1/2 animate-ambient rounded-full opacity-20 blur-3xl sm:h-[34rem] sm:w-[34rem]"
        style={{ backgroundColor: "var(--accent)" }}
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-14 pt-12 sm:pb-16 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-white px-3.5 py-1.5 font-body text-xs font-medium uppercase tracking-wider accent-text shadow-soft">
            First-trip playbooks
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] text-ink sm:mt-6 sm:text-5xl lg:text-6xl">
            Do your first trip abroad{" "}
            <span className="accent-text theme-transition">right.</span>
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-ink/70 sm:mt-6 sm:text-lg">
            Which eSIM beats your carrier pack. How to carry zero-markup forex.
            The cab app locals actually use. Honest, India-specific advice for
            first-time international travellers — so you don&apos;t overpay or get
            caught out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/plan"
              className="flex min-h-[44px] items-center rounded-pill bg-coral px-7 py-3 font-body text-base font-semibold text-white shadow-soft transition-transform duration-200 hover:scale-[1.03]"
            >
              Plan my trip
            </Link>
            <a
              href="#destinations"
              className="flex min-h-[44px] items-center rounded-pill border border-hairline bg-white px-7 py-3 font-body text-base font-semibold text-navy shadow-soft transition-transform duration-200 hover:scale-[1.03]"
            >
              Browse destinations
            </a>
          </div>
        </div>

        {/* Interactive, themed checklist card */}
        <div className="rounded-card border border-hairline bg-white/85 p-6 shadow-lift backdrop-blur-sm sm:p-8">
          <div className="mb-5 flex flex-wrap gap-2">
            {destinations.map((d) => {
              const isActive = d.slug === (selected ?? activeSlug);
              return (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => setSelected(d.slug)}
                  onPointerEnter={() => setHovered(d.slug)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(d.slug)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={isActive}
                  className={`theme-transition flex min-h-[44px] items-center gap-2 rounded-pill border px-4 py-2 font-body text-sm font-medium ${
                    isActive
                      ? "accent-bg accent-border text-white"
                      : "border-hairline bg-fill/40 text-ink/70 hover:border-primary/40"
                  }`}
                >
                  <span aria-hidden>{d.flag}</span>
                  {d.title}
                </button>
              );
            })}
          </div>

          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-display text-xl font-semibold text-ink">
              Your first {content.title} trip
            </h2>
            <Link
              href={`/${content.slug}`}
              className="inline-flex min-h-[44px] items-center font-body text-sm font-semibold accent-text hover:text-navy"
            >
              Full playbook →
            </Link>
          </div>
          <p className="mb-4 font-body text-sm text-ink/55">
            Tick these off before you go.
          </p>

          <Checklist items={content.checklist} replayKey={content.slug} />
        </div>
      </div>
    </section>
  );
}
