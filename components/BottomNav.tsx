"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Compass, Utensils, Music, Mountain, Bookmark, User } from "lucide-react";
import { WORLDS } from "@/lib/worlds/config";

const ICONS = { compass: Compass, utensils: Utensils, music: Music, mountain: Mountain, bookmark: Bookmark, user: User } as const;

/**
 * World switcher — the persistent shell nav. Green brand chrome, lucide icons;
 * active world gets the accent. Preserves dev overrides (?at/?hour) and the
 * world's own query presets across switches.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const [cat, setCat] = useState<string | null>(null);
  const [keep, setKeep] = useState("");
  useEffect(() => {
    const cur = new URLSearchParams(window.location.search);
    setCat(cur.get("cat"));
    const kept = new URLSearchParams();
    for (const k of ["at", "hour"]) { const v = cur.get(k); if (v) kept.set(k, v); }
    setKeep(kept.toString());
  }, [pathname]);
  const MAIN = new Set(["/", "/food", "/nights", "/do", "/trip", "/arrival", "/events", "/me", "/worlds"]);
  const BAR = new Set(["explore", "food", "nightlife", "activities", "trip"]); // Do lives in Explore; Me in the header
  if (!MAIN.has(pathname)) return null;

  return (
    <nav aria-label="Worlds" className="fixed inset-x-5 z-40"
      style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}>
      <ul className="mx-auto flex max-w-[400px] items-center justify-around rounded-pill border border-white/25 bg-[#1C1A16]/[0.14] px-2 py-2 shadow-[0_16px_40px_-16px_rgba(28,26,22,0.45)]"
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        {WORLDS.filter((w) => ["explore", "food", "nightlife", "activities", "trip"].includes(w.id)).map((w) => {
          const [base, preset] = w.route.split("?");
          const active = pathname === base && (new URLSearchParams(preset).get("cat") ?? null) === cat;
          const href = base + (preset || keep ? `?${[preset, keep].filter(Boolean).join("&")}` : "");
          const Icon = ICONS[w.icon];
          return (
            <li key={w.id}>
              <Link href={href} aria-current={active ? "page" : undefined} aria-label={w.label}
                className={`flex h-10 items-center gap-1.5 rounded-pill px-3 transition-colors ${
                  active ? "bg-accent/15 text-accent" : "text-fg/60 hover:text-fg"
                }`}>
                <Icon size={19} strokeWidth={active ? 2 : 1.7} aria-hidden />
                {active ? <span className="text-[11px] font-semibold">{w.short}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}