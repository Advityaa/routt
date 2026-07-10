"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Clock } from "lucide-react";
import type { Event } from "@/lib/types";
import { getEventsThisWeek } from "@/lib/dataProvider";
import { getVenueImage } from "@/lib/placeholderImages";
import { getActiveCity } from "@/lib/worlds/cities";

/** SEARCH — the front door across ALL worlds: places (→ detail), food (→ Food
 *  lens), events (→ Nights). Real venue search where the city has live data;
 *  honest mock elsewhere. Recent searches persist locally. */

const CYCLE = ["attractions…", "food…", "nightlife…", "activities…"];
const RECENT_KEY = "routt.recentSearches";
const TRENDING: Record<string, string[]> = {
  bangkok: ["rooftop bar", "pad thai", "chatuchak", "temple"],
  dubai: ["desert safari", "marina", "brunch", "souk"],
  singapore: ["hawker", "gardens", "rooftop", "laksa"],
};

interface VenueHit { gers_id: string; name: string; app_category: string | null; locality: string | null; signals?: { verdict_state: string } }

export default function SearchPage() {
  const city = useRef(typeof window === "undefined" ? null : getActiveCity());
  const c = city.current ?? { id: "bangkok", label: "Bangkok", dataMode: "real" as const, lat: 13.75, lng: 100.5 };
  const [ph, setPh] = useState(0);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<VenueHit[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")); } catch {}
    const t = setInterval(() => setPh((p) => (p + 1) % CYCLE.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!q.trim()) { setHits([]); setEvents([]); return; }
    const t = setTimeout(async () => {
      const term = q.trim().toLowerCase();
      try { const r = [term, ...recent.filter((x) => x !== term)].slice(0, 6); localStorage.setItem(RECENT_KEY, JSON.stringify(r)); setRecent(r); } catch {}
      if (c.dataMode === "real") {
        const res = await fetch(`/api/venues?q=${encodeURIComponent(term)}&limit=8&lat=${c.lat}&lng=${c.lng}`);
        setHits(res.ok ? (await res.json()).venues ?? [] : []);
      } else {
        setHits([0, 1, 2].map((i) => ({ gers_id: `mock-${i}`, name: `${c.label} ${term} spot ${i + 1}`, app_category: "see", locality: "preview" })));
      }
      const evs = await getEventsThisWeek({ lat: c.lat, lng: c.lng });
      setEvents(evs.filter((e) => e.name.toLowerCase().includes(term)).slice(0, 3));
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (label: string, onTap: () => void, Icon?: typeof Clock) => (
    <button key={label} onClick={onTap} className="flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-2 text-[13px] text-muted">
      {Icon ? <Icon size={13} /> : null}{label}
    </button>
  );

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas px-5 pb-28 pt-5">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line"><ArrowLeft size={16} /></Link>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-pill border border-line bg-surface px-4 py-3">
          <Search size={15} className="shrink-0 text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Search ${c.label}`}
            placeholder={`explore ${CYCLE[ph]}`} className="min-w-0 flex-1 bg-transparent text-[14px] text-fg placeholder:text-muted focus:outline-none" />
        </div>
      </div>

      {!q.trim() ? (
        <>
          {recent.length ? (<><p className="pb-2.5 pt-6 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Recent</p>
            <div className="flex flex-wrap gap-2">{recent.map((r) => chip(r, () => setQ(r), Clock))}</div></>) : null}
          <p className="pb-2.5 pt-6 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Trending in {c.label}</p>
          <div className="flex flex-wrap gap-2">{(TRENDING[c.id] ?? TRENDING.bangkok).map((t) => chip(t, () => setQ(t)))}</div>
          <p className="pb-2.5 pt-6 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Browse worlds</p>
          <div className="flex flex-wrap gap-2">
            {[["Explore", "/"], ["Food", "/?cat=eat"], ["Nights", "/events"], ["Do", "/?cat=shop"]].map(([l, h]) => (
              <Link key={l} href={h} className="rounded-pill bg-fg px-4 py-2 text-[13px] font-semibold text-canvas">{l}</Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {hits.length ? <p className="pb-2.5 pt-6 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Places</p> : null}
          {hits.map((v) => (
            <Link key={v.gers_id} href={v.gers_id.startsWith("mock") ? "#" : `/place/${v.gers_id}`} className="flex items-center gap-3 border-b border-line py-3">
              <span className="h-[52px] w-[52px] shrink-0 rounded-[12px] bg-elevate bg-cover bg-center" style={{ backgroundImage: `url(${getVenueImage((v.app_category as never) ?? "see", v.gers_id)})` }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[16px] font-medium text-fg">{v.name}</span>
                <span className="font-mono text-[11px] uppercase text-muted">{v.app_category ?? "place"}{v.locality ? ` · ${v.locality}` : ""}</span>
              </span>
              <span className="font-mono text-[10px] uppercase text-faint">{v.app_category === "eat" ? "Food" : "Explore"}</span>
            </Link>
          ))}
          {events.length ? <p className="pb-2.5 pt-6 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Events</p> : null}
          {events.map((e) => (
            <Link key={e.id} href="/events" className="flex items-center gap-3 border-b border-line py-3">
              <span className="h-[52px] w-[52px] shrink-0 rounded-[12px] bg-elevate bg-cover bg-center" style={{ backgroundImage: `url(${getVenueImage("see", e.id)})` }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[16px] font-medium text-fg">{e.name}</span>
                <span className="font-mono text-[11px] text-muted">{e.venue} · {e.dateISO.slice(5, 10)}</span>
              </span>
              <span className="font-mono text-[10px] uppercase text-faint">Nights</span>
            </Link>
          ))}
          {!hits.length && !events.length ? <p className="pt-8 text-center font-mono text-[12px] text-muted">Nothing found for “{q}” in {c.label}.</p> : null}
        </>
      )}
    </main>
  );
}
