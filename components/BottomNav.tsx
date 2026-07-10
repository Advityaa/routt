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
  const BAR = new Set(["explore", "food", "nightlife", "trip"]); // Do lives in Explore; Me in the header
  if (!MAIN.has(pathname)) return null;

  return (
    <nav aria-label="Worlds" className="fixed inset-x-5 z-40 rounded-pill border border-line/80 bg-canvas/80 shadow-[0_12px_32px_-12px_rgba(28,26,22,0.35)] backdrop-blur-xl"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom))" }}>
      <ul className="mx-auto flex max-w-[400px] items-stretch justify-around px-2 py-1">
        {WORLDS.filter((w) => ["explore","food","nightlife","trip"].includes(w.id)).map((w) => {
          const [base, preset] = w.route.split("?");
          const active = pathname === base && (new URLSearchParams(preset).get("cat") ?? null) === cat;
          const href = base + (preset || keep ? `?${[preset, keep].filter(Boolean).join("&")}` : "");
          const Icon = ICONS[w.icon];
          return (
            <li key={w.id} className="flex-1">
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 py-1 transition ${active ? "text-accent" : "text-muted hover:text-fg"}`}>
                <Icon size={20} strokeWidth={active ? 2 : 1.6} aria-hidden />
                {active ? <span className="text-[10px] font-semibold tracking-wide">{w.short}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
