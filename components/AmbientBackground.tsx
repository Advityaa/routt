"use client";

import { useEffect, useState } from "react";
import { useRoutt } from "@/lib/context/RouttContext";

/**
 * AmbientBackground — context-driven atmosphere layer (from useRoutt()).
 * Pure CSS gradients (GPU-cheap, no loops/JS animation), rendered behind
 * content and under the text scrim so legibility never drops. Crossfades
 * between states via a two-layer opacity swap; prefers-reduced-motion gets an
 * instant cut (motion-reduce:transition-none). Weather softens/greys the tint
 * when overcast/rainy, brightens slightly when clear.
 *
 * Destination imagery hook: when trips carry a destination, swap the hero
 * photo per-destination here — v1 has Bangkok only, so imagery is static and
 * only the atmosphere adapts.
 */

const TINTS: Record<string, string> = {
  dawn: "linear-gradient(180deg, rgba(255,166,100,0.28), rgba(255,120,90,0.14) 55%, rgba(30,20,40,0.10))",
  day: "linear-gradient(180deg, rgba(120,180,255,0.16), rgba(255,255,255,0.06) 60%, rgba(0,0,0,0))",
  dusk: "linear-gradient(180deg, rgba(255,150,60,0.30), rgba(190,90,120,0.18) 55%, rgba(20,15,45,0.16))",
  night: "linear-gradient(180deg, rgba(20,25,70,0.38), rgba(10,12,35,0.22) 55%, rgba(0,0,10,0.18))",
};

function softener(condition?: string | null): string | null {
  if (!condition) return null;
  const c = condition.toLowerCase();
  if (/overcast|fog|drizzle|rain|shower|thunder|snow/.test(c))
    return "linear-gradient(180deg, rgba(120,125,130,0.22), rgba(90,95,100,0.14))"; // soften/grey
  if (/clear/.test(c)) return "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))"; // brighten
  return null;
}

export default function AmbientBackground({ className = "" }: { className?: string }) {
  const { timeOfDay, weather } = useRoutt();
  const target = `${TINTS[timeOfDay]}|${softener(weather?.condition) ?? ""}`;

  // Two-layer crossfade: current stays put, next fades in, then becomes current.
  const [current, setCurrent] = useState(target);
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => {
    if (target === current || target === next) return;
    setNext(target);
    const t = setTimeout(() => {
      setCurrent(target);
      setNext(null);
    }, 1300);
    return () => clearTimeout(t);
  }, [target, current, next]);

  const layers = (spec: string, visible: boolean) => {
    const [tint, soft] = spec.split("|");
    return (
      <div
        className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0" style={{ background: tint }} />
        {soft ? <div className="absolute inset-0" style={{ background: soft }} /> : null}
      </div>
    );
  };

  return (
    <div aria-hidden data-ambient={timeOfDay} className={`pointer-events-none absolute inset-0 ${className}`}>
      {layers(current, true)}
      {next ? layers(next, true) : null}
    </div>
  );
}
