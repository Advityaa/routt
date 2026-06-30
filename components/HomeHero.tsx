"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Calendar, Search } from "lucide-react";
import type { DestinationMeta } from "@/lib/content";
import { getTheme, themeVars } from "@/lib/theme";

function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${`${n.getMonth() + 1}`.padStart(2, "0")}-${`${n.getDate()}`.padStart(2, "0")}`;
}

/**
 * Immersive, full-bleed hero. A high-quality destination photo (slow ken-burns,
 * CSS only) sits edge-to-edge; selecting or hovering a destination crossfades
 * the image and shifts the accent. A floating frosted-glass panel carries the
 * primary action: destination + dates + "Plan my trip".
 *
 * Theming is an accent layer only — nav + the coral action stay brand-blue.
 */
export default function HomeHero({ destinations }: { destinations: DestinationMeta[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(destinations[0]?.slug ?? "");
  const [hovered, setHovered] = useState<string | null>(null);
  const [date, setDate] = useState("");

  const activeSlug = hovered ?? selected;
  const theme = getTheme(activeSlug);
  const active = destinations.find((d) => d.slug === activeSlug) ?? destinations[0];

  const plan = () =>
    router.push(`/plan?dest=${selected}${date ? `&date=${date}` : ""}`);

  return (
    <section
      style={themeVars(theme)}
      className="theme-transition relative flex min-h-[36rem] flex-col justify-end overflow-hidden text-white sm:h-[88vh]"
    >
      {/* Full-bleed photo with ken-burns + crossfade on change */}
      <div className="absolute inset-0 -z-10 bg-navy">
        <div key={activeSlug} className="absolute inset-0 animate-fade-in">
          <div className="absolute inset-0 animate-ken-burns">
            <Image
              src={theme.heroImage || getTheme(destinations[0]?.slug).heroImage}
              alt={active?.title ? `${active.title} — ${theme.mood}` : theme.mood}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
        {/* Top + bottom scrims for legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,18,30,0.55) 0%, rgba(8,18,30,0) 22%, rgba(8,18,30,0) 48%, rgba(8,18,30,0.82) 100%)",
          }}
        />
        {/* Subtle destination accent tint */}
        <div
          aria-hidden
          className="theme-transition absolute inset-0 mix-blend-multiply"
          style={{ backgroundColor: "var(--accent-deep)", opacity: 0.14 }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-28 sm:pb-14">
        {/* Current location chip */}
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 font-body text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {active?.title}, {active?.country}
        </span>

        <h1 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-[1.03] drop-shadow-sm sm:text-6xl lg:text-7xl">
          Find your next destination.
        </h1>
        <p className="mt-4 max-w-xl font-body text-lg leading-relaxed text-white/85">
          Pick a place, set your dates, and Routt plans the trip for you — visas,
          money, connectivity, the lot. For every kind of traveller.
        </p>

        {/* Floating glass action panel — the signature element */}
        <div className="mt-8 rounded-[20px] border border-white/40 bg-white/75 p-4 shadow-lift backdrop-blur-md sm:p-5">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-ink/55">
            Where to?
          </p>
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {destinations.map((d) => {
              const on = d.slug === selected;
              return (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => setSelected(d.slug)}
                  onPointerEnter={() => setHovered(d.slug)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(d.slug)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={on}
                  className={`theme-transition flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-pill border px-3.5 font-body text-sm font-medium ${
                    on
                      ? "accent-bg accent-border text-white"
                      : "border-hairline bg-white/70 text-ink/70 hover:border-primary/40"
                  }`}
                >
                  {d.title}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-[48px] flex-1 items-center gap-2 rounded-2xl border border-hairline bg-white px-4">
              <Calendar className="h-5 w-5 shrink-0 text-ink/40" aria-hidden />
              <span className="sr-only">Trip start date</span>
              <input
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent font-body text-base text-ink focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={plan}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-pill bg-coral px-7 font-body text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
            >
              <Search className="h-5 w-5" aria-hidden />
              Plan my trip
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
