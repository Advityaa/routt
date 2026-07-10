"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Compass, Utensils, Music, Mountain, Bookmark, User, Search, ChevronDown } from "lucide-react";
import { WORLDS } from "@/lib/worlds/config";
import { CITIES, getActiveCity, setActiveCity, type CityDef } from "@/lib/worlds/cities";

const ICONS = { compass: Compass, utensils: Utensils, music: Music, mountain: Mountain, bookmark: Bookmark, user: User } as const;

/**
 * WorldShell — shared header (active city + search entry) and the lightweight
 * world-switcher nav. Wraps migrated worlds; legacy screens keep their own
 * chrome until each moves over, so nothing breaks mid-refactor.
 */
export default function WorldShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [city, setCity] = useState<CityDef>(CITIES[0]);
  const [picking, setPicking] = useState(false);
  useEffect(() => setCity(getActiveCity()), []);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas pb-28">
      {/* Shared header: active city + search entry */}
      <header className="flex items-center justify-between px-5 pt-5">
        <button onClick={() => setPicking((v) => !v)} aria-expanded={picking}
          className="flex items-center gap-1.5 font-display text-[17px] font-semibold text-fg">
          {city.label} <ChevronDown size={15} className="text-muted" />
        </button>
        <Link href="/search" aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg">
          <Search size={16} strokeWidth={1.8} />
        </Link>
      </header>
      {picking ? (
        <div className="mx-5 mt-2 overflow-hidden rounded-card border border-line bg-surface">
          {CITIES.map((c) => (
            <button key={c.id} onClick={() => { setActiveCity(c.id); setCity(c); setPicking(false); }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-[14px] ${c.id === city.id ? "font-semibold text-fg" : "text-muted"}`}>
              {c.label}
              <span className="font-mono text-[10px] uppercase text-faint">{c.dataMode === "real" ? "live data" : "preview"}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* World switcher */}
      <nav aria-label="Worlds" className="mt-4 flex gap-2 px-5">
        {WORLDS.map((w) => {
          const Icon = ICONS[w.icon];
          const active = pathname === w.route;
          return (
            <Link key={w.id} href={w.route}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill border py-2 text-[12.5px] font-medium ${active ? "border-fg bg-fg text-canvas" : "border-line text-muted"}`}>
              <Icon size={14} strokeWidth={1.8} /> {w.short}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4">{children}</div>
    </div>
  );
}
