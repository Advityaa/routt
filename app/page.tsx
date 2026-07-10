"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Category, Event, ScoredPlace, CredibilityVerdict } from "@/lib/types";
import { getNearbyPlaces, getEventsThisWeek, getAreaLabel } from "@/lib/dataProvider";
import { getTimeOfDay, getSituationPrompt, getDefaultCategory } from "@/lib/timeContext";
import { useRoutt } from "@/lib/context/RouttContext";
import { homePriority } from "@/lib/context/priority";
import { getVenueImage, getHeroImage } from "@/lib/placeholderImages";
import AmbientBackground from "@/components/AmbientBackground";

// Fallback when geolocation is denied/unavailable — central Sukhumvit, Bangkok.
const BANGKOK_DEFAULT = { lat: 13.7376, lng: 100.5602 };
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "eat", label: "Eat" }, { value: "drink", label: "Drink" },
  { value: "shop", label: "Shop" }, { value: "see", label: "See" },
];

function formatClock(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${period}`;
}
const formatDistance = (m: number) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

/** Thin-stroke verdict chip per the mockup: icon + label, green reserved for verdicts. */
function VerdictChip({ verdict }: { verdict: CredibilityVerdict }) {
  const spec: Record<CredibilityVerdict, { label: string; color: string }> = {
    "still-good": { label: "Still good", color: "var(--accent)" },
    fading: { label: "Fading", color: "var(--verdict-fading)" },
    "tourist-trap": { label: "Tourist trap", color: "var(--verdict-trap)" },
    mixed: { label: "Mixed", color: "var(--muted)" },
    unrated: { label: "Not rated", color: "#B5AE9C" },
  };
  const s = spec[verdict];
  return (
    <span className="flex items-center gap-1 text-[10.5px] font-semibold" style={{ color: s.color }}>
      {verdict === "still-good" ? (
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L8 14.5L16 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" /></svg>
      )}
      {s.label}
    </span>
  );
}

export default function Home() {
  const routt = useRoutt();
  const priority = homePriority(routt.tripPhase, routt.timeOfDay);
  const [now, setNow] = useState(() => new Date());
  const [hourOverride, setHourOverride] = useState<number | null>(null);
  const [coords, setCoords] = useState(BANGKOK_DEFAULT);
  const [locStatus, setLocStatus] = useState<"locating" | "gps" | "default">("locating");
  const [area, setArea] = useState("Bangkok");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [places, setPlaces] = useState<ScoredPlace[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveHour = hourOverride ?? now.getHours();
  const timeOfDay = getTimeOfDay(effectiveHour);
  const activeCategory = selectedCategory ?? getDefaultCategory(timeOfDay);
  const prompt = getSituationPrompt(timeOfDay);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("hour");
    if (raw !== null) {
      const h = Number(raw);
      if (Number.isFinite(h) && h >= 0 && h <= 23) setHourOverride(Math.floor(h));
    }
    const tick = setInterval(() => setNow(new Date()), 30_000);
    // Dev/test override: ?at=25.2,55.27 pins the location (like ?hour=).
    const at = new URLSearchParams(window.location.search).get("at");
    const [la, ln] = (at ?? "").split(",").map(Number);
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      setCoords({ lat: la, lng: ln });
      setLocStatus("gps");
    } else {
      requestLocation();
    }
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return setLocStatus("default");
    setLocStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus("gps"); },
      () => setLocStatus("default"),
      { timeout: 8000, maximumAge: 300_000 },
    );
  }

  useEffect(() => {
    let alive = true;
    getAreaLabel(coords).then((l) => alive && setArea(l));
    return () => { alive = false; };
  }, [coords]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPlaces([]); // clear immediately so switching shows the skeleton, never a frozen stale list
    getNearbyPlaces({ category: activeCategory, lat: coords.lat, lng: coords.lng, nowHour: effectiveHour }).then((res) => {
      if (alive) { setPlaces(res); setLoading(false); }
    });
    return () => { alive = false; };
  }, [activeCategory, effectiveHour, coords.lat, coords.lng]);

  useEffect(() => {
    let alive = true;
    getEventsThisWeek(coords).then((res) => alive && setEvents(res.slice(0, 4)));
    return () => { alive = false; };
  }, [coords.lat, coords.lng]);

  const clock = formatClock(effectiveHour, now.getMinutes());
  const weekday = WEEKDAYS[now.getDay()];
  const photoFor = (sp: ScoredPlace) => sp.place.photos?.[0]?.url ?? getVenueImage(sp.place.category, sp.place.id);
  const metaFor = (sp: ScoredPlace) =>
    sp.place.reviewCount > 0 ? `${sp.place.recentReviewCount90d || sp.place.reviewCount} reviews` : "be the first";
  const lead = places[0];
  const rest = places.slice(1);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas pb-28">
      {/* HERO — full-bleed photo, Ken Burns, bottom-heavy scrim (handoff motif 1) */}
      <section className="relative h-[440px] overflow-hidden bg-[#24201a]">
        <div
          className="kenburns absolute -inset-5 bg-cover bg-center"
          style={{ backgroundImage: `url(${getHeroImage(effectiveHour)})` }}
        />
        <AmbientBackground />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,6,0.38) 0%, rgba(10,9,6,0.05) 22%, rgba(10,9,6,0.18) 46%, rgba(10,9,6,0.86) 80%, rgba(10,9,6,0.97) 100%)" }} />
        <div className="relative z-[2] flex items-center justify-between px-5 pt-5">
          <span className="font-display text-[18px] font-semibold tracking-[0.02em] text-white">Routt</span>
          {routt.weather ? (
            <span className="rounded-pill border border-white/[0.28] bg-white/[0.14] px-[13px] py-[7px] font-mono text-[10.5px] uppercase tracking-[0.05em] text-white backdrop-blur-md" data-testid="greeting">
              {routt.weather.tempC}° · {routt.weather.condition}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-[22px] bottom-[74px] z-[2] text-white">
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.08em] opacity-[0.82]">
            {weekday} · {clock} · {area}
          </div>
          <h1 className="font-display text-[33px] font-medium leading-[1.1] tracking-[-0.01em]">{prompt}</h1>
        </div>
      </section>

      {/* FLOATING GLASS PILLBAR on the hero seam (handoff motif 2) */}
      <div className="relative z-[3] mx-5 -mt-[30px] flex gap-2 rounded-[18px] border border-white/60 bg-white/[0.72] p-[9px] shadow-[0_16px_32px_-14px_rgba(0,0,0,0.35)] backdrop-blur-xl" role="tablist" aria-label="Category">
        {CATEGORIES.map((c) => {
          const active = c.value === activeCategory;
          return (
            <button key={c.value} role="tab" aria-selected={active} onClick={() => setSelectedCategory(c.value)}
              className={`flex-1 rounded-[12px] py-[9px] text-center font-sans text-[13.5px] font-medium transition ${active ? "bg-fg text-canvas" : "text-muted"}`}>
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="relative z-[1] pt-[22px]">
        {/* Contextual tone line (priority function) as a mono section label */}
        <p className="px-5 pb-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted" data-testid="tone">{priority.tone}</p>

        {/* Lead trip/rate card when the phase demands it */}
        {priority.order[0] === "trip" || priority.order[0] === "rate" ? (
          <div className="mx-5 mb-4" data-section={priority.order[0]}>
            <Link href="/trip" className="block rounded-card border border-line bg-surface p-4">
              <div className="text-eyebrow uppercase text-muted">{priority.order[0] === "trip" ? "Your trip" : "After the trip"}</div>
              <p className="mt-1.5 text-[14.5px] text-fg">{priority.order[0] === "trip" ? (routt.tripPhase === "preflight" ? "Final checklist & arrival essentials →" : "Saved places & prep →") : "Rate the places you visited →"}</p>
            </Link>
          </div>
        ) : null}

        {/* SIGNATURE TICKET CARD — rank 01 (handoff motif 3) */}
        <div data-section="feed">
        {loading && !lead ? (
          <div className="mx-5 h-[104px] animate-pulse rounded-[18px] bg-surface shadow-[0_14px_28px_-14px_rgba(28,26,22,0.22)]" />
        ) : lead ? (
          <Link href={`/place/${lead.place.id}`} className="animate-rise relative mx-5 flex bg-surface shadow-[0_14px_28px_-14px_rgba(28,26,22,0.22)]" style={{ borderRadius: 18 }} data-testid="ticket">
            <div className="relative w-[104px] shrink-0 rounded-l-[18px] bg-elevate bg-cover bg-center" style={{ backgroundImage: `url(${photoFor(lead)})` }}>
              <span className="absolute left-2 top-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-surface font-mono text-[11px] font-medium">01</span>
            </div>
            {/* punch-hole notches on the perforation */}
            <div className="relative w-0">
              <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-canvas" />
              <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-canvas" />
            </div>
            <div className="min-w-0 flex-1 border-l-[1.5px] border-dashed border-line py-3.5 pl-4 pr-3.5">
              <div className="flex h-full flex-col justify-center gap-[5px]">
                <VerdictChip verdict={lead.credibility.verdict} />
                <div className="truncate font-display text-[18px] font-medium leading-[1.2] text-fg">{lead.place.name}</div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                  <span>{formatDistance(lead.distanceMeters)}</span>
                  <span className="opacity-50">·</span>
                  <span>{metaFor(lead)}</span>
                </div>
              </div>
            </div>
            <div className="flex w-[34px] shrink-0 items-center justify-center border-l-[1.5px] border-dashed border-line">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted" style={{ writingMode: "vertical-rl" }}>
                {lead.place.category}
              </span>
            </div>
          </Link>
        ) : null}

        {/* Compact rows for ranks 02+ */}
        {rest.length > 0 ? (
          <>
            <p className="px-5 pb-3 pt-[26px] font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Also open nearby</p>
            <div className="px-5">
              {rest.map((sp, i) => (
                <Link key={sp.place.id} href={`/place/${sp.place.id}`}
                  className={`animate-rise flex items-center gap-3.5 px-1 py-[13px] ${i < rest.length - 1 ? "border-b border-line" : ""}`}
                  style={{ animationDelay: `${(i + 1) * 90}ms` }}>
                  <span className="w-4 shrink-0 font-mono text-[12px] text-muted">{String(i + 2).padStart(2, "0")}</span>
                  <span className="h-[54px] w-[54px] shrink-0 rounded-[12px] bg-elevate bg-cover bg-center" style={{ backgroundImage: `url(${photoFor(sp)})` }} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-display text-[16px] font-medium leading-[1.25] ${sp.credibility.verdict === "unrated" ? "text-muted" : "text-fg"}`}>{sp.place.name}</span>
                    <span className="mt-[3px] flex items-center gap-1.5 text-[11.5px] text-muted">
                      {formatDistance(sp.distanceMeters)} <span className="opacity-50">·</span> {metaFor(sp)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <VerdictChip verdict={sp.credibility.verdict} />
                    <span className="font-mono text-[11px] text-muted">{sp.place.homeCurrencyEstimate || "—"}</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
        {!loading && places.length === 0 ? (
          <p className="px-5 py-8 text-center font-mono text-[12px] text-muted">Nothing worth recommending nearby right now.</p>
        ) : null}
        </div>

        {locStatus === "default" ? (
          <button onClick={requestLocation} className="mt-4 px-5 font-mono text-[11.5px] text-muted transition hover:text-fg">
            Using Bangkok · <span className="underline underline-offset-2">set location</span>
          </button>
        ) : null}

        {/* ON THIS WEEK — secondary events hook */}
        {events.length > 0 ? (
          <section className="mt-8 px-5" data-section="events">
            <h2 className="pb-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">On this week</h2>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {events.map((ev) => {
                const m = ev.dateISO.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
                return (
                  <a key={ev.id} href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" className="w-[200px] shrink-0 rounded-card border border-line bg-surface p-3.5">
                    <div className="flex items-baseline gap-2 font-mono text-[11px] text-muted">
                      <span className="uppercase tracking-wider">{m ? `${m[3]}/${m[2]}` : ""}</span>
                      <span className="text-faint">{m ? `${m[4]}:${m[5]}` : ""}</span>
                    </div>
                    <div className="mt-1.5 line-clamp-2 font-display text-[14px] font-medium leading-snug text-fg">{ev.name}</div>
                    <div className="mt-1 truncate font-mono text-[11px] text-muted">{ev.venue}</div>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Non-lead trip/rate entries */}
        {priority.order.filter((k, i) => i > 0 && (k === "trip" || k === "rate")).map((k) => (
          <section key={k} className="mt-8 px-5" data-section={k}>
            <Link href="/trip" className="block rounded-card border border-line bg-surface p-4">
              <div className="text-eyebrow uppercase text-muted">{k === "trip" ? "Your trip" : "After the trip"}</div>
              <p className="mt-1.5 text-[14.5px] text-fg">{k === "trip" ? "Saved places & prep →" : "Rate the places you visited →"}</p>
            </Link>
          </section>
        ))}

        {process.env.NEXT_PUBLIC_DATA_MODE === "db" ? (
          <footer className="mt-10 border-t border-line px-5 pt-4 text-center font-mono text-[10.5px] leading-relaxed text-faint">
            Place data © Overture Maps Foundation · © OpenStreetMap contributors
          </footer>
        ) : null}
      </div>
    </main>
  );
}
