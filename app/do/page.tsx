"use client";

import { useEffect, useState } from "react";
import { getVenueImage } from "@/lib/placeholderImages";
import { getActiveCity, CITIES, type CityDef } from "@/lib/worlds/cities";

/** ACTIVITIES world — bookable experiences. Cards hand off to the experiences
 *  provider (GetYourGuide adapter) — commercial, DISCLOSED, tracked via the
 *  partner param. Catalogue is curated/mock until a real feed is wired;
 *  country-agnostic via per-city templates. */

const GYG_PARTNER = "ROUTT1"; // affiliate handoff id (tracked)
const gygUrl = (q: string, city: string) =>
  `https://www.getyourguide.com/s/?q=${encodeURIComponent(`${q} ${city}`)}&partner_id=${GYG_PARTNER}`;

interface Act { id: string; title: string; duration: string; from: string; rating: number; q: string }
const TEMPLATES: Record<string, Record<string, Act[]>> = {
  bangkok: {
    "Water & adventure": [
      { id: "a1", title: "Chao Phraya kayak at dawn", duration: "3 h", from: "$28", rating: 4.7, q: "kayak" },
      { id: "a2", title: "Koh Larn snorkelling day", duration: "9 h", from: "$55", rating: 4.5, q: "snorkeling" },
      { id: "a3", title: "Muay Thai training session", duration: "2 h", from: "$35", rating: 4.8, q: "muay thai class" },
    ],
    "Tours & day trips": [
      { id: "b1", title: "Ayutthaya temples day trip", duration: "10 h", from: "$49", rating: 4.6, q: "ayutthaya" },
      { id: "b2", title: "Floating market long-tail tour", duration: "6 h", from: "$38", rating: 4.4, q: "floating market" },
      { id: "b3", title: "Old town food crawl by night", duration: "4 h", from: "$42", rating: 4.9, q: "food tour" },
    ],
    "Unique experiences": [
      { id: "c1", title: "Thai cooking class w/ market visit", duration: "4 h", from: "$33", rating: 4.9, q: "cooking class" },
      { id: "c2", title: "Vintage tuk-tuk night ride", duration: "3 h", from: "$45", rating: 4.7, q: "tuk tuk tour" },
    ],
  },
  dubai: {
    "Water & adventure": [
      { id: "d1", title: "Jet ski the Marina", duration: "1 h", from: "$79", rating: 4.6, q: "jet ski" },
      { id: "d2", title: "Scuba intro dive", duration: "4 h", from: "$120", rating: 4.5, q: "scuba" },
    ],
    "Tours & day trips": [
      { id: "d3", title: "Desert safari + BBQ camp", duration: "7 h", from: "$52", rating: 4.7, q: "desert safari" },
      { id: "d4", title: "Abu Dhabi mosque day trip", duration: "9 h", from: "$65", rating: 4.6, q: "abu dhabi tour" },
    ],
    "Unique experiences": [
      { id: "d5", title: "Hot air balloon at sunrise", duration: "5 h", from: "$260", rating: 4.8, q: "hot air balloon" },
    ],
  },
};

export default function DoPage() {
  const [city, setCity] = useState<CityDef>(CITIES[0]);
  useEffect(() => { setCity(getActiveCity()); }, []);
  const rows = TEMPLATES[city.id] ?? TEMPLATES.bangkok;
  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas pb-28">
      <header className="px-5 pb-4 pt-6" style={{ background: "linear-gradient(180deg, rgba(154,100,16,0.07), transparent)" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Activities · {city.label} · curated</div>
        <h1 className="mt-1 font-display text-[30px] font-medium tracking-[-0.01em] text-fg">Do something you&apos;ll retell</h1>
      </header>
      {Object.entries(rows).map(([title, acts]) => (
        <section key={title} className="mt-5">
          <h2 className="px-5 pb-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{title}</h2>
          <div className="flex gap-3 overflow-x-auto px-5 pb-1">
            {acts.map((a) => (
              <a key={a.id} href={gygUrl(a.q, city.label)} target="_blank" rel="sponsored noopener noreferrer" className="w-[200px] shrink-0">
                <div className="relative h-[150px] overflow-hidden bg-elevate" style={{ borderRadius: 16 }}>
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getVenueImage("see", `${city.id}-${a.id}`)})` }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(10,9,6,0.75) 100%)" }} />
                  <span className="absolute right-2 top-2 rounded-pill bg-white/85 px-2 py-0.5 font-mono text-[9.5px] text-fg">★ {a.rating}</span>
                  <div className="absolute inset-x-3 bottom-2.5 text-white">
                    <div className="line-clamp-2 font-display text-[15px] font-medium leading-[1.2]">{a.title}</div>
                  </div>
                </div>
                <div className="mt-1.5 flex justify-between px-0.5 font-mono text-[11px] text-muted">
                  <span>{a.duration}</span><span className="text-fg">from {a.from}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-8 px-5 text-[10.5px] leading-relaxed text-faint">
        Bookings hand off to GetYourGuide — Routt may earn a commission at no extra cost to you.
        Prices are “from” estimates; confirm at checkout.
      </p>
    </main>
  );
}
