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
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center font-display text-xl font-semibold tracking-tight text-navy sm:text-2xl"
        >
          Routt
        </Link>
        <div className="flex items-center gap-1 font-body text-sm sm:gap-6">
          <Link
            href="/#destinations"
            className="hidden min-h-[44px] items-center px-2 text-ink/70 transition-colors hover:text-navy md:flex"
          >
            Destinations
          </Link>
          <Link
            href="/#how"
            className="hidden min-h-[44px] items-center px-2 text-ink/70 transition-colors hover:text-navy md:flex"
          >
            How it works
          </Link>
          <Link
            href="/plan"
            className="flex min-h-[44px] items-center rounded-pill bg-navy px-4 font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            Plan my trip
          </Link>
        </div>
      </nav>
    </header>
  );
}
