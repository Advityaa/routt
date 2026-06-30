"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Backpack, Check, CloudSun, Luggage, Minus, Plus, Ticket, X } from "lucide-react";
import { ACTIVITIES } from "@/lib/packing/data";
import { generatePacking } from "@/lib/packing/generate";
import type { PackingItem, WeatherSummary } from "@/lib/packing/types";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${`${dt.getUTCMonth() + 1}`.padStart(2, "0")}-${`${dt.getUTCDate()}`.padStart(2, "0")}`;
}
function rangeLabel(start: string, end: string): string {
  const s = start.split("-").map(Number);
  const e = end.split("-").map(Number);
  const sm = MONTHS_SHORT[s[1] - 1];
  const em = MONTHS_SHORT[e[1] - 1];
  return sm === em ? `${s[2]}–${e[2]} ${sm}` : `${s[2]} ${sm} – ${e[2]} ${em}`;
}

interface Persisted {
  tripDays: number;
  activities: string[];
  checked: string[];
  custom: PackingItem[];
}

/**
 * Smart packing list — reusable, fed by {tripId, destination, cityName, lat,
 * lng, startDate}. Fetches weather server-side (via /api/weather), then builds
 * a personalised, reasoned list. Selections + checked + custom items persist
 * (localStorage, non-sensitive).
 */
export default function PackingList({
  tripId,
  destination,
  cityName,
  lat,
  lng,
  startDate,
}: {
  tripId: string;
  destination: string;
  cityName: string;
  lat: number;
  lng: number;
  startDate: string;
}) {
  const KEY = `routt.packing.v1.${tripId}`;
  const [mounted, setMounted] = useState(false);
  const [tripDays, setTripDays] = useState(5);
  const [activities, setActivities] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [custom, setCustom] = useState<PackingItem[]>([]);
  const [customText, setCustomText] = useState("");
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Load persisted state once.
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (typeof p.tripDays === "number") setTripDays(p.tripDays);
        if (Array.isArray(p.activities)) setActivities(p.activities);
        if (Array.isArray(p.checked)) setChecked(p.checked);
        if (Array.isArray(p.custom)) setCustom(p.custom);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEY]);

  // Persist on change.
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ tripDays, activities, checked, custom }));
    } catch {
      /* ignore */
    }
  }, [KEY, mounted, tripDays, activities, checked, custom]);

  const endDate = addDays(startDate, Math.max(0, tripDays - 1));

  // Fetch weather server-side; never blocks UI (skeleton while loading).
  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("loading");
    fetch(`/api/weather?lat=${lat}&lng=${lng}&start=${startDate}&end=${endDate}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { summary: WeatherSummary | null }) => {
        setWeather(d.summary);
        setStatus(d.summary ? "ready" : "error");
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus("error");
      });
    return () => ctrl.abort();
  }, [lat, lng, startDate, endDate]);

  const result = useMemo(
    () => generatePacking({ summary: weather, tripDays, activities, destination, cityName }),
    [weather, tripDays, activities, destination, cityName]
  );

  const allIds = [
    ...result.weather.map((i) => i.id),
    ...result.activity.map((i) => i.id),
    ...result.essentials.map((i) => i.id),
    ...custom.map((i) => i.id),
  ];
  const doneCount = checked.filter((id) => allIds.includes(id)).length;
  const total = allIds.length;

  const toggleChecked = (id: string) =>
    setChecked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleActivity = (key: string) =>
    setActivities((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  const addCustom = () => {
    const label = customText.trim();
    if (!label) return;
    setCustom((p) => [...p, { id: `custom-${p.length}-${label.toLowerCase().replace(/\W+/g, "-")}`, label }]);
    setCustomText("");
  };

  if (!mounted) return <div className="min-h-[12rem]" aria-hidden />;

  return (
    <div>
      {/* Weather summary header */}
      {status === "loading" ? (
        <div className="h-12 w-full animate-pulse rounded-xl bg-fill" />
      ) : status === "ready" && weather ? (
        <div className="rounded-xl border border-hairline bg-fill/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <CloudSun className="h-4 w-4 text-primary" aria-hidden />
            <span className="font-body text-sm font-semibold text-ink">
              {cityName}, {rangeLabel(startDate, endDate)}
            </span>
            <span className="rounded-pill border border-primary/30 bg-white px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-primary">
              {weather.mode === "forecast" ? "Forecast" : "Typical for this time of year"}
            </span>
          </div>
          <p className="mt-1 font-body text-sm text-ink/65">{weather.summaryText}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-hairline bg-fill/30 px-4 py-3 font-body text-sm text-ink/55">
          Weather couldn&apos;t load right now — your activity &amp; essentials list is still ready below.
        </div>
      )}

      {/* Trip length + activities */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-pill border border-hairline bg-white px-2 py-1">
          <button
            type="button"
            aria-label="Fewer days"
            onClick={() => setTripDays((d) => Math.max(1, d - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:bg-fill"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-[5.5rem] text-center font-body text-sm font-semibold text-ink">
            {tripDays} {tripDays === 1 ? "day" : "days"}
          </span>
          <button
            type="button"
            aria-label="More days"
            onClick={() => setTripDays((d) => Math.min(21, d + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:bg-fill"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIVITIES.map((a) => {
          const on = activities.includes(a.key);
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => toggleActivity(a.key)}
              aria-pressed={on}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border px-3 font-body text-sm transition-colors ${
                on ? "border-primary bg-primary text-white" : "border-hairline bg-white text-ink/70 hover:border-primary/40"
              }`}
            >
              {on ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between font-body text-sm">
          <span className="font-semibold text-ink">{doneCount} of {total} packed</span>
          <span className="text-ink/50">{total ? Math.round((doneCount / total) * 100) : 0}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-fill">
          <div
            className="accent-bg h-full rounded-pill bg-primary transition-all duration-500"
            style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Groups */}
      <div className="mt-5 space-y-6">
        <Group title="Weather-based" icon={<CloudSun className="h-4 w-4" />} items={result.weather} checked={checked} onToggle={toggleChecked} />
        <Group title="For your activities" icon={<Ticket className="h-4 w-4" />} items={result.activity} checked={checked} onToggle={toggleChecked} emptyHint="Pick activities above to tailor this." />
        <Group title="Essentials" icon={<Luggage className="h-4 w-4" />} items={result.essentials} checked={checked} onToggle={toggleChecked} />
        <Group title="Your items" icon={<Backpack className="h-4 w-4" />} items={custom} checked={checked} onToggle={toggleChecked} onRemove={(id) => setCustom((p) => p.filter((i) => i.id !== id))} />
      </div>

      {/* Add custom */}
      <div className="mt-4 flex gap-2">
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Add your own item…"
          aria-label="Add a custom packing item"
          className="min-h-[44px] flex-1 rounded-2xl border border-hairline bg-white px-4 font-body text-base text-ink focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustom}
          className="flex min-h-[44px] items-center gap-1.5 rounded-pill bg-navy px-5 font-body text-sm font-semibold text-white hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add
        </button>
      </div>
    </div>
  );
}

function Group({
  title,
  icon,
  items,
  checked,
  onToggle,
  onRemove,
  emptyHint,
}: {
  title: string;
  icon: React.ReactNode;
  items: PackingItem[];
  checked: string[];
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
  emptyHint?: string;
}) {
  if (items.length === 0 && !emptyHint) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
        {icon}
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 font-body text-sm text-ink/45">{emptyHint}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => {
            const on = checked.includes(item.id);
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-hairline bg-white px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-pressed={on}
                  aria-label={on ? `Unpack ${item.label}` : `Pack ${item.label}`}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    on ? "border-primary bg-primary text-white" : "border-hairline bg-fill/50 text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`font-body text-sm font-medium ${on ? "text-ink/40 line-through" : "text-ink"}`}>
                    {item.label}
                  </span>
                  {item.reason ? (
                    <span className="mt-0.5 block font-body text-xs leading-snug text-ink/55">{item.reason}</span>
                  ) : null}
                </span>
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.label}`}
                    className="shrink-0 text-ink/30 hover:text-coral"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
