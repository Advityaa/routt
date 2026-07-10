"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Category, ScoredPlace, CredibilityVerdict } from "@/lib/types";
import { getNearbyPlaces } from "@/lib/dataProvider";
import { useRoutt } from "@/lib/context/RouttContext";
import { getVenueImage, getHeroImage, HERO_AMBIENT } from "@/lib/placeholderImages";
import { CITIES, getActiveCity, setActiveCity, type CityDef } from "@/lib/worlds/cities";
import AmbientBackground from "@/components/AmbientBackground";

/** EXPLORE world — image-led discovery for the ACTIVE CITY (country-agnostic).
 *  Real rows via the venue store where dataMode==="real"; honest mock preview
 *  cards elsewhere. Hero + greeting come from the context engine. */

const GREET = { dawn: "Good morning", day: "Good afternoon", dusk: "Good evening", night: "Good evening" } as const;

interface CardData { id: string; name: string; meta: string; photo: string; verdict?: CredibilityVerdict; href?: string }

function toCard(sp: ScoredPlace): CardData {
  return {
    id: sp.place.id,
    name: sp.place.name,
    meta: sp.distanceMeters < 1000 ? `${sp.distanceMeters} m` : `${(sp.distanceMeters / 1000).toFixed(1)} km`,
    photo: sp.place.photos?.[0]?.url ?? getVenueImage(sp.place.category, sp.place.id),
    verdict: sp.credibility.verdict,
    href: `/place/${sp.place.id}`,
  };
}
function mockCards(city: CityDef, kind: Category, n = 5): CardData[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${city.id}-${kind}-${i}`,
    name: `${city.label} ${kind === "see" ? "landmark" : kind === "eat" ? "eatery" : "spot"} ${i + 1}`,
    meta: "preview",
    photo: getVenueImage(kind, `${city.id}-${kind}-${i}`),
  }));
}

const CHIP: Record<string, string> = { "still-good": "var(--accent)", fading: "var(--verdict-fading)", "tourist-trap": "var(--verdict-trap)", mixed: "var(--muted)", unrated: "#B5AE9C" };
const CHIP_LABEL: Record<string, string> = { "still-good": "Still good", fading: "Fading", "tourist-trap": "Tourist trap", mixed: "Mixed", unrated: "Not rated" };

function Carousel({ title, cards }: { title: string; cards: CardData[] }) {
  if (!cards.length) return null;
  return (
    <section className="mt-7">
      <h2 className="px-5 pb-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2">
        {cards.map((c) => {
          const inner = (
            <div className="relative h-[240px] w-[180px] shrink-0 overflow-hidden bg-elevate" style={{ borderRadius: 16 }}>
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${c.photo})` }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,6,0.05) 40%, rgba(10,9,6,0.78) 100%)" }} />
              {c.verdict ? (
                <span className="absolute left-2.5 top-2.5 rounded-pill bg-black/35 px-2 py-1 text-[10px] font-semibold backdrop-blur-sm" style={{ color: CHIP[c.verdict] === "var(--accent)" ? "#7ADCA9" : "#E8E2D2" }}>
                  {CHIP_LABEL[c.verdict]}
                </span>
              ) : null}
              <div className="absolute inset-x-3 bottom-3 text-white">
                <div className="font-display text-[16px] font-medium leading-[1.2]">{c.name}</div>
                <div className="mt-0.5 font-mono text-[10.5px] text-white/75">{c.meta}</div>
              </div>
            </div>
          );
          return c.href ? <Link key={c.id} href={c.href} className="shrink-0">{inner}</Link> : <div key={c.id} className="shrink-0">{inner}</div>;
        })}
      </div>
    </section>
  );
}

export default function ExplorePage() {
  const routt = useRoutt();
  const [city, setCity] = useState<CityDef>(CITIES[0]);
  const [hour, setHour] = useState(new Date().getHours());
  const [rows, setRows] = useState<{ seeing: CardData[]; attractions: CardData[]; near: CardData[] }>({ seeing: [], attractions: [], near: [] });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const h = Number(q.get("hour"));
    if (Number.isFinite(h) && h >= 0 && h <= 23) setHour(h);
    setCity(getActiveCity());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (city.dataMode === "real") {
        const [see, shop, eat] = await Promise.all([
          getNearbyPlaces({ category: "see", lat: city.lat, lng: city.lng, nowHour: hour }),
          getNearbyPlaces({ category: "shop", lat: city.lat, lng: city.lng, nowHour: hour }),
          getNearbyPlaces({ category: "eat", lat: city.lat, lng: city.lng, nowHour: hour }),
        ]);
        if (alive) setRows({ seeing: see.map(toCard), attractions: shop.map(toCard), near: eat.map(toCard) });
      } else {
        setRows({ seeing: mockCards(city, "see"), attractions: mockCards(city, "shop"), near: mockCards(city, "eat") });
      }
    })();
    return () => { alive = false; };
  }, [city, hour]);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas pb-28">
      {/* Hero — active city, context greeting */}
      <section className="relative h-[340px] overflow-hidden bg-[#24201a]">
        <div className="kenburns absolute -inset-5 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_AMBIENT[city.id === "bangkok" ? 0 : city.id === "dubai" ? 1 : 2] ?? getHeroImage(hour)})` }} />
        <AmbientBackground />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,6,0.35) 0%, rgba(10,9,6,0.1) 35%, rgba(10,9,6,0.85) 100%)" }} />
        <div className="relative z-[2] flex items-center justify-between px-5 pt-5">
          <span className="font-display text-[18px] font-semibold text-white">Routt</span>
          {routt.weather ? (
            <span className="rounded-pill border border-white/[0.28] bg-white/[0.14] px-3 py-[7px] font-mono text-[10.5px] uppercase tracking-[0.05em] text-white backdrop-blur-md">
              {routt.weather.tempC}° · {routt.weather.condition}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-5 bottom-[22px] z-[2]">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/80">{GREET[routt.timeOfDay]} in</div>
          <div className="mt-1 flex items-end justify-between">
            <select aria-label="Active city" value={city.id}
              onChange={(e) => { setActiveCity(e.target.value); setCity(CITIES.find((c) => c.id === e.target.value)!); }}
              className="appearance-none border-none bg-transparent font-display text-[34px] font-medium tracking-[-0.01em] text-white">
              {CITIES.map((c) => <option key={c.id} value={c.id} className="text-fg">{c.label}</option>)}
            </select>
            {city.dataMode === "mock" ? <span className="mb-2 font-mono text-[9.5px] uppercase text-white/60">preview data</span> : null}
          </div>
          {/* Search front door */}
          <Link href="/trip" className="mt-3 flex items-center gap-2.5 rounded-pill border border-white/[0.35] bg-white/[0.16] px-4 py-3 text-[13.5px] text-white/85 backdrop-blur-md">
            <Search size={15} strokeWidth={1.8} /> Search {city.label} — places, links…
          </Link>
        </div>
      </section>

      {/* Category lenses */}
      <div className="mt-4 flex gap-2 px-5">
        <span className="rounded-pill bg-fg px-4 py-2 text-[13px] font-semibold text-canvas">See</span>
        <Link href={`/?cat=shop`} className="rounded-pill border border-line px-4 py-2 text-[13px] font-medium text-muted">Do</Link>
        <Link href="/?cat=eat" className="rounded-pill border border-line px-4 py-2 text-[13px] font-medium text-muted">Eat → Food</Link>
      </div>

      <Carousel title="Worth seeing now" cards={rows.seeing} />
      <Carousel title="Popular attractions" cards={rows.attractions} />
      <Carousel title="Near you" cards={rows.near} />

      {process.env.NEXT_PUBLIC_DATA_MODE === "db" ? (
        <footer className="mt-10 border-t border-line px-5 pt-4 text-center font-mono text-[10.5px] text-faint">
          Place data © Overture Maps Foundation · © OpenStreetMap contributors
        </footer>
      ) : null}
    </main>
  );
}
