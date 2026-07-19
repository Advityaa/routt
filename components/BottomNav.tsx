"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MapPin, Bookmark, Plane, Calendar } from "lucide-react";

/**
 * Persistent, thumb-reachable bottom tab bar. Lucide icons, thin strokes;
 * active tab in the accent green (icon + label), inactive grey. Shown on the
 * four top-level screens; hidden on pushed/sub screens (place detail, etc).
 */
const TABS = [
  { href: "/", label: "Experiences", Icon: MapPin },
  { href: "/arrival", label: "Flights", Icon: Plane },
  { href: "/trip", label: "Trip", Icon: Bookmark },
] as const;

const MAIN_ROUTES = new Set<string>(TABS.map((t) => t.href));

export default function BottomNav() {
  const pathname = usePathname();
  // Carry dev/test overrides (?at=, ?hour=) across tab navigation, else they
  // silently drop and the app snaps back to real GPS/time mid-test.
  const [keep, setKeep] = useState("");
  useEffect(() => {
    const cur = new URLSearchParams(window.location.search);
    const kept = new URLSearchParams();
    for (const k of ["at", "hour"]) { const v = cur.get(k); if (v) kept.set(k, v); }
    setKeep(kept.toString() ? `?${kept.toString()}` : "");
  }, [pathname]);
  if (!MAIN_ROUTES.has(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-5 z-40 md:hidden transition-all duration-300"
      style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex max-w-[400px] items-center justify-around rounded-full border border-line bg-surface/95 px-2 py-2 shadow-[0_16px_40px_-16px_rgba(28,26,22,0.45)] backdrop-blur-xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href + keep}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center gap-2 rounded-full px-4 transition-all active:scale-95 duration-200 ${
                  active ? "bg-accent/10 text-accent font-semibold" : "text-muted hover:text-fg hover:bg-elevate"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden />
                {active ? <span className="font-sans text-[13px] tracking-wide font-semibold">{label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
