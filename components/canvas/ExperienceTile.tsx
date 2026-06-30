"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { trackExperienceClick } from "@/lib/affiliate";
import type { Experience } from "@/lib/experiences/types";

const inr = (n: number, c: string) => `${c === "INR" ? "₹" : c + " "}${n.toLocaleString("en-IN")}`;

/**
 * "Worth seeing" tile — a real, hand-picked experience for the destination,
 * fetched via /api/experiences (normalized adapter data). Opens the provider
 * booking page with our tracking + fires the tracked click event.
 */
export default function ExperienceTile({ destination, cityName }: { destination: string; cityName: string }) {
  const [exp, setExp] = useState<Experience | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/experiences/${destination}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { experiences?: Experience[] }) => {
        const top = d.experiences?.[0] ?? null;
        setExp(top);
        setStatus(top ? "ready" : "empty");
      })
      .catch(() => setStatus("empty"));
    return () => ctrl.abort();
  }, [destination]);

  return (
    <div className="canvas-tile p-6">
      <p className="canvas-label">Worth seeing in {cityName}</p>
      {status === "loading" ? (
        <div className="mt-3.5 h-[150px] w-full animate-pulse rounded-2xl bg-white/10" />
      ) : status === "ready" && exp ? (
        <a
          href={exp.bookingUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackExperienceClick({ provider: exp.provider, city: destination, experienceId: exp.id, category: exp.category })}
          className="group mt-3.5 block"
        >
          <div className="relative h-[150px] overflow-hidden rounded-2xl">
            <Image
              src={exp.image}
              alt={exp.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 400px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <p className="mt-3 font-display text-xl font-semibold text-white">{exp.title}</p>
          <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-canvasmuted">
            <Star className="h-4 w-4 fill-skyaccent text-skyaccent" aria-hidden />
            <span className="font-semibold text-white">{exp.rating.toFixed(1)}</span>
            · from <span className="text-white">{inr(exp.priceFrom, exp.currency)}</span>
          </p>
        </a>
      ) : (
        <Link href={`/${destination}`} className="mt-3.5 block font-body text-sm text-skyaccent hover:underline">
          Explore things to do in {cityName} →
        </Link>
      )}
    </div>
  );
}
