"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Bookmark, Plane, Calendar } from "lucide-react";

/**
 * Persistent, thumb-reachable bottom tab bar. Lucide icons, thin strokes;
 * active tab in the accent green (icon + label), inactive grey. Shown on the
 * four top-level screens; hidden on pushed/sub screens (place detail, etc).
 */
const TABS = [
  { href: "/", label: "Now", Icon: MapPin },
  { href: "/trip", label: "Trip", Icon: Bookmark },
  { href: "/arrival", label: "Arrival", Icon: Plane },
  { href: "/events", label: "Events", Icon: Calendar },
] as const;

const MAIN_ROUTES = new Set<string>(TABS.map((t) => t.href));

export default function BottomNav() {
  const pathname = usePathname();
  if (!MAIN_ROUTES.has(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-[440px] items-stretch justify-around px-2 pt-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-badge py-1 transition ${
                  active ? "text-accent" : "text-muted hover:text-fg"
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2 : 1.6} aria-hidden />
                <span className={`font-sans text-[10px] tracking-wide ${active ? "font-semibold" : "font-medium"}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
