"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { getEventsThisWeek } from "@/lib/dataProvider";
import { getVenueImage } from "@/lib/placeholderImages";
import { getActiveCity, CITIES, type CityDef } from "@/lib/worlds/cities";

/** NIGHTLIFE & EVENTS — the "what's the vibe tonight" world. Dark, poster-led,
 *  green accent intact. Ticketmaster real for UAE; curated elsewhere (labelled).
 *  Bars row comes from the real venue store where the city has live data. */

interface Bar { gers_id: string; name: string; locality: string | null }

function Poster({ img, title, sub, tag, href }: { img: string; title: string; sub: string; tag?: string; href?: string }) {
  const inner = (
    <div className="relative h-[210px] w-[160px] shrink-0 overflow-hidden bg-[#1E1B15]" style={{ borderRadius: 14 }}>
      <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${img})` }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,4,2,0.1) 30%, rgba(5,4,2,0.92) 100%)" }} />
      {tag ? <span className="absolute left-2 top-2 rounded-pill bg-black/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent backdrop-blur-sm">{tag}</span> : null}
      <div className="absolute inset-x-2.5 bottom-2.5 text-white">
        <div className="line-clamp-2 font-display text-[14.5px] font-medium leading-[1.2]">{title}</div>
        <div className="mt-0.5 truncate font-mono text-[9.5px] uppercase text-white/65">{sub}</div>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer" className="shrink-0">{inner}</a> : <div className="shrink-0">{inner}</div>;
}

function Row({ title, children }: { title: string; children: React.ReactNode[] }) {
  if (!children.length) return null;
  return (
    <section className="mt-6">
      <h2 className="px-5 pb-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#8F887A]">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1">{children}</div>
    </section>
  );
}

export default function NightsPage() {
  const [city, setCity] = useState<CityDef>(CITIES[0]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [real, setReal] = useState(false);
  useEffect(() => { setCity(getActiveCity()); }, []);
  useEffect(() => {
    let alive = true;
    getEventsThisWeek({ lat: city.lat, lng: city.lng }).then((evs) => {
      if (!alive) return;
      setEvents(evs);
      setReal(evs.some((e) => e.id.startsWith("tm-")));
    });
    if (city.dataMode === "real") {
      fetch(`/api/venues?category=drink&limit=8&lat=${city.lat}&lng=${city.lng}`)
        .then((r) => r.json()).then((d) => alive && setBars(d.venues ?? [])).catch(() => {});
    } else {
      setBars([0, 1, 2, 3].map((i) => ({ gers_id: `${city.id}-bar-${i}`, name: `${city.label} bar ${i + 1}`, locality: "preview" })));
    }
    return () => { alive = false; };
  }, [city]);

  const today = new Date().toISOString().slice(0, 10);
  const when = (e: Event) => `${e.venue} · ${e.dateISO.slice(5, 16).replace("T", " ")}`;
  const posterFor = (e: Event) => <Poster key={e.id} img={getVenueImage("see", e.id)} title={e.name} sub={when(e)} tag={e.type} href={e.ticketUrl} />;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] pb-28" style={{ background: "#14110C" }}>
      <header className="px-5 pt-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#8F887A]">
          Nightlife & Events · {city.label} · {real ? "live via Ticketmaster" : "curated calendar"}
        </div>
        <h1 className="mt-1 font-display text-[30px] font-medium tracking-[-0.01em] text-[#F5EFE2]">
          What&apos;s the vibe tonight
        </h1>
      </header>

      <Row title="Tonight">{events.filter((e) => e.dateISO.slice(0, 10) === today).map(posterFor)}</Row>
      <Row title="This week">{events.map(posterFor)}</Row>
      <Row title="Live music">{events.filter((e) => e.type === "music" || e.type === "nightlife").map(posterFor)}</Row>
      <Row title="Nightlife & bars">{bars.map((b) => (
        <Link key={b.gers_id} href={b.gers_id.includes("-bar-") ? "#" : `/place/${b.gers_id}`} className="shrink-0">
          <Poster img={getVenueImage("drink", b.gers_id)} title={b.name} sub={b.locality ?? "bar"} tag="bar" />
        </Link>
      ))}</Row>
      <Row title="Cultural & art">{events.filter((e) => e.type === "art" || e.type === "culture").map(posterFor)}</Row>

      {events.length === 0 ? <p className="px-5 pt-8 text-center font-mono text-[12px] text-[#8F887A]">Nothing on the radar this week.</p> : null}
    </main>
  );
}
