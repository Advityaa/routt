"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Sticky nav — the one and only glass surface in Routt. Its hairline bottom
 * border fades in once the user scrolls past the hero's top edge.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`nav-glass sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-nav" : "shadow-none"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-navy"
        >
          Routt
        </Link>
        <div className="flex items-center gap-7 font-body text-sm">
          <Link
            href="/#destinations"
            className="text-ink/70 transition-colors hover:text-navy"
          >
            Destinations
          </Link>
          <Link
            href="/#how"
            className="text-ink/70 transition-colors hover:text-navy"
          >
            How it works
          </Link>
          <Link
            href="/#email"
            className="rounded-pill bg-navy px-4 py-2 font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            Get the guide
          </Link>
        </div>
      </nav>
    </header>
  );
}
