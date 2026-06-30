"use client";

import { useMemo, useState } from "react";
import { Check, Globe2, Search, Share2 } from "lucide-react";
import {
  COUNTRIES,
  CONTINENT_BLOBS,
  TOTAL_COUNTRIES,
  continentsVisited,
  project,
} from "@/lib/canvas/countries";
import { useCountUp } from "@/lib/canvas/useCountUp";

/**
 * "% of world travelled" — self-declared visited countries → a headline number,
 * a lightweight SVG world map (dots on an equirectangular projection, no map
 * library), stats, and a shareable card. No tracking, no location data.
 */
export default function WorldMap({
  visited,
  onToggle,
}: {
  visited: string[];
  onToggle: (code: string) => void;
}) {
  const [q, setQ] = useState("");
  const [shared, setShared] = useState(false);

  const visitedSet = useMemo(() => new Set(visited), [visited]);
  const percentTarget = Math.round((visited.length / TOTAL_COUNTRIES) * 100);
  const percent = useCountUp(percentTarget);
  const continents = continentsVisited(visited);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(t)) : COUNTRIES;
  }, [q]);

  const suggestions = COUNTRIES.filter((c) => !visitedSet.has(c.code)).slice(0, 3);

  const share = async () => {
    const text = `I've explored ${percentTarget}% of the world with Routt — ${visited.length} countries across ${continents} continents.`;
    try {
      if (navigator.share) await navigator.share({ title: "My Routt travel map", text });
      else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user cancelled / unavailable */
    }
  };

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-white shadow-soft">
      {/* Shareable card surface */}
      <div className="bg-gradient-to-b from-fill/50 to-white px-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
              <Globe2 className="h-4 w-4" aria-hidden /> World explored
            </p>
            <p className="mt-1 font-display text-4xl font-semibold text-ink sm:text-5xl">
              {Math.round(percent)}%
            </p>
            <p className="font-body text-sm text-ink/60">
              {visited.length} of {TOTAL_COUNTRIES} countries · {continents}{" "}
              {continents === 1 ? "continent" : "continents"}
            </p>
          </div>
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border border-hairline bg-white px-4 font-body text-sm font-semibold text-navy transition-colors hover:bg-fill/50"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {shared ? "Copied!" : "Share"}
          </button>
        </div>

        {/* Lightweight SVG world map */}
        <svg
          viewBox="0 0 360 180"
          className="mt-4 w-full"
          role="img"
          aria-label={`World map with ${visited.length} countries marked as visited`}
        >
          <rect x="0" y="0" width="360" height="180" rx="10" fill="#F0F6FC" />
          {CONTINENT_BLOBS.map((b, i) => (
            <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill="#DEEBF7" />
          ))}
          {COUNTRIES.map((c) => {
            const { x, y } = project(c.lat, c.lng);
            const on = visitedSet.has(c.code);
            return (
              <circle
                key={c.code}
                cx={x}
                cy={y}
                r={on ? 2.8 : 1.6}
                fill={on ? "#1E6FB8" : "#9FBBD8"}
                className="cursor-pointer transition-all duration-300"
                onClick={() => onToggle(c.code)}
              >
                <title>{c.name}</title>
              </circle>
            );
          })}
        </svg>
      </div>

      {/* Suggestions */}
      {suggestions.length ? (
        <div className="flex flex-wrap items-center gap-2 px-6 pt-5">
          <span className="font-body text-xs font-medium text-ink/50">Next?</span>
          {suggestions.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => onToggle(c.code)}
              className="rounded-pill border border-hairline bg-fill/40 px-3 py-1 font-body text-xs font-medium text-navy hover:border-primary/40"
            >
              + {c.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Searchable country picker */}
      <div className="px-6 py-5">
        <label className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-hairline bg-white px-4">
          <Search className="h-4 w-4 shrink-0 text-ink/40" aria-hidden />
          <span className="sr-only">Search countries you&apos;ve visited</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mark countries you've visited…"
            className="w-full bg-transparent py-2 font-body text-base text-ink focus:outline-none"
          />
        </label>
        <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
          {filtered.map((c) => {
            const on = visitedSet.has(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => onToggle(c.code)}
                aria-pressed={on}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border px-3 font-body text-sm transition-colors ${
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-hairline bg-white text-ink/70 hover:border-primary/40"
                }`}
              >
                {on ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
