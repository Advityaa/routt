"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRoutt } from "@/lib/context/RouttContext";
import { getSaved } from "@/lib/savedTrip";
import { getTrip } from "@/lib/trip";
import { getActiveCity } from "@/lib/worlds/cities";

/** Me — the shared spine surfaced: identity-lite, contributions, trip context. */
export default function MePage() {
  const routt = useRoutt();
  const [saved, setSaved] = useState(0);
  const [helped, setHelped] = useState(0);
  const [trip, setTrip] = useState<string | null>(null);
  const [city, setCity] = useState("Bangkok");
  useEffect(() => {
    setSaved(getSaved().length);
    setHelped(Number(localStorage.getItem("routt.helpedCount") ?? 0));
    const t = getTrip();
    setTrip(t ? `${t.destination} · ${t.startISO}` : null);
    setCity(getActiveCity().label);
  }, []);
  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas px-5 pb-28 pt-6">
      <h1 className="font-display text-[30px] font-medium tracking-[-0.01em] text-fg">Me</h1>
      <div className="mt-5 flex border-y border-line">
        {[[saved, "Saved"], [helped, "Travellers helped"], [routt.tripPhase, "Trip phase"]].map(([v, l], i) => (
          <div key={String(l)} className={`flex-1 px-1.5 py-3.5 text-center ${i ? "border-l border-line" : ""}`}>
            <div className="font-mono text-[15px] font-medium text-fg">{String(v)}</div>
            <div className="mt-[3px] text-[10.5px] uppercase tracking-[0.04em] text-muted">{String(l)}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 text-[14px]">
        <div className="rounded-card border border-line bg-surface p-4">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Active city</div>
          <p className="mt-1 text-fg">{city}</p>
        </div>
        <Link href="/trip" className="rounded-card border border-line bg-surface p-4">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Trip</div>
          <p className="mt-1 text-fg">{trip ?? "No trip set — add a flight or destination →"}</p>
        </Link>
      </div>
    </main>
  );
}
