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
    <nav aria-label="Worlds" className="fixed inset-x-0 z-40 flex justify-center"
      style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}>
      <ul className="flex items-center gap-5 rounded-pill bg-[#1C1A16]/85 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(28,26,22,0.5)] backdrop-blur-md">
        {WORLDS.filter((w) => ["explore", "food", "nightlife", "activities", "trip"].includes(w.id)).map((w) => {
          const [base, preset] = w.route.split("?");
          const active = pathname === base && (new URLSearchParams(preset).get("cat") ?? null) === cat;
          const href = base + (preset || keep ? `?${[preset, keep].filter(Boolean).join("&")}` : "");
          const Icon = ICONS[w.icon];
          return (
            <li key={w.id}>
              <Link href={href} aria-current={active ? "page" : undefined} aria-label={w.label}
                className={`flex items-center justify-center rounded-full transition-all ${
                  active
                    ? "-my-3 h-[52px] w-[52px] bg-accent text-white shadow-[0_8px_20px_-4px_rgba(31,138,91,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]"
                    : "h-9 w-9 text-[#8F887A] hover:text-[#F5EFE2]"
                }`}>
                <Icon size={active ? 21 : 20} strokeWidth={active ? 2 : 1.7} aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
