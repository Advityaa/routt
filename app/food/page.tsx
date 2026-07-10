"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ActionBar from "@/components/ActionBar";
import { getVenueImage } from "@/lib/placeholderImages";
import { getActiveCity, type CityDef, CITIES } from "@/lib/worlds/cities";


/** FOOD world — appetising, photography-led, country-agnostic. Lenses pull
 *  Overture/OSM diet + cuisine tags where the city has real data; honest mock
 *  preview elsewhere. Chrome stays Routt green; warmth comes from imagery. */

const LENSES = [
  { key: "locals", title: "Loved by locals", taxq: "" },
  { key: "veg", title: "Veg / vegetarian-friendly", taxq: "vegetarian,vegan" },
  { key: "halal", title: "Halal", taxq: "halal" },
  { key: "cafe", title: "Cafes & coffee", taxq: "cafe,coffee,bakery" },
  { key: "dinner", title: "Rooftop & dinner", taxq: "rooftop,fine_dining,steak,seafood,barbecue" },
];

interface Hit { gers_id: string; name: string; basic_category: string | null; taxonomy: string | null; lat: number; lng: number; signals?: { verdict_state: string }; mock?: boolean }
const cuisine = (v: Hit) => (v.basic_category ?? "restaurant").replace(/_/g, " ");
const dietBadges = (v: Hit) => {
  const t = `${v.basic_category} ${v.taxonomy}`.toLowerCase();
  return [/vegetarian|vegan/.test(t) && "veg", /halal/.test(t) && "halal"].filter(Boolean) as string[];
};
const VERDICT: Record<string, [string, string]> = { "still-good": ["Still good", "var(--accent)"], fading: ["Fading", "var(--verdict-fading)"], mixed: ["Mixed", "var(--muted)"] };

function Card({ v }: { v: Hit }) {
  const [label, color] = VERDICT[v.signals?.verdict_state ?? ""] ?? ["Not rated yet", "#B5AE9C"];
  return (
    <div className="w-[210px] shrink-0">
      <Link href={v.mock ? "#" : `/place/${v.gers_id}`} className="relative block h-[150px] overflow-hidden bg-elevate" style={{ borderRadius: 16 }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getVenueImage("eat", v.gers_id)})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,6,0.02) 30%, rgba(10,9,6,0.55) 68%, rgba(10,9,6,0.92) 100%)" }} />
        <div className="absolute left-2.5 top-2.5 flex gap-1">
          {dietBadges(v).map((d) => (
            <span key={d} className="rounded-pill bg-white/85 px-2 py-0.5 font-mono text-[9px] font-medium uppercase text-fg">{d}</span>
          ))}
        </div>
        <div className="absolute inset-x-3 bottom-2.5 text-white">
          <div className="truncate font-display text-[15.5px] font-medium">{v.name}</div>
          <div className="font-mono text-[10px] uppercase text-white/75">{cuisine(v)} · $$</div>
        </div>
      </Link>
      <div className="mt-1.5 flex items-center justify-between px-0.5">
        <span className="text-[10.5px] font-semibold" style={{ color }}>{label}</span>
        <ActionBar lat={v.lat} lng={v.lng} name={v.name} gersId={v.mock ? undefined : v.gers_id} country={getActiveCity().country} />

      </div>
    </div>
  );
}

export default function FoodPage() {
  const [city, setCity] = useState<CityDef>(CITIES[0]);
  const [rows, setRows] = useState<Record<string, Hit[]>>({});
  useEffect(() => { setCity(getActiveCity()); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<string, Hit[]> = {};
      for (const l of LENSES) {
        if (city.dataMode === "real") {
          const q = new URLSearchParams({ category: "eat", limit: "8", lat: String(city.lat), lng: String(city.lng) });
          if (l.taxq) q.set("taxq", l.taxq);
          const r = await fetch(`/api/venues?${q}`);
          out[l.key] = r.ok ? (await r.json()).venues ?? [] : [];
        } else {
          out[l.key] = [0, 1, 2, 3].map((i) => ({ gers_id: `${city.id}-${l.key}-${i}`, name: `${city.label} ${l.title.split(" ")[0].toLowerCase()} spot ${i + 1}`, basic_category: "restaurant", taxonomy: l.taxq, lat: city.lat, lng: city.lng, mock: true }));
        }
      }
      if (alive) setRows(out);
    })();
    return () => { alive = false; };
  }, [city]);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas pb-28">
      <header className="relative overflow-hidden px-5 pb-5 pt-6" style={{ background: "linear-gradient(180deg, rgba(178,58,46,0.07), transparent)" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Food · {city.label}{city.dataMode === "mock" ? " · preview" : ""}</div>
        <h1 className="mt-1 font-display text-[30px] font-medium tracking-[-0.01em] text-fg">Where locals actually eat</h1>
      </header>
      {LENSES.map((l) => {
        const cards = rows[l.key] ?? [];
        if (!cards.length) return null;
        return (
          <section key={l.key} className="mt-5">
            <h2 className="px-5 pb-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{l.title}</h2>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1">{cards.map((v) => <Card key={v.gers_id} v={v} />)}</div>
          </section>
        );
      })}
    </main>
  );
}
