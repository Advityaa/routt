"use client";

import { Plane } from "lucide-react";
import { countdownHeadline, daysUntilTrip, progress } from "@/lib/countdown";
import type { CanvasTrip } from "@/lib/canvas/store";

/**
 * A trip rendered as a premium virtual boarding pass: route (home → city),
 * dates, live countdown, and a prep-progress bar. Tapping it opens the full
 * countdown. When freshly created it plays an "issuing" reveal.
 *
 * Wraps REAL trip data (engine countdown + checklist progress) — no hollow art.
 */
export default function BoardingPass({
  trip,
  totalTasks,
  issuing = false,
  onOpen,
}: {
  trip: CanvasTrip;
  totalTasks: number;
  issuing?: boolean;
  onOpen?: () => void;
}) {
  const days = daysUntilTrip(trip.tripDate);
  const prog = progress(totalTasks || 0, trip.done.length);
  const code = trip.destination.slice(0, 3).toUpperCase();
  const homeCode = (trip.homeCity || "HOM").slice(0, 3).toUpperCase();

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group block w-full overflow-hidden rounded-card text-left shadow-lift transition-transform duration-200 hover:-translate-y-1 ${
        issuing ? "animate-issue-pass" : ""
      }`}
    >
      {/* Header band — Routt blue (brand) */}
      <div
        className="relative px-6 py-4"
        style={{ background: "linear-gradient(120deg, #13548F, #1E6FB8)" }}
      >
        <div className="flex items-center justify-between text-white">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            Routt · Boarding pass
          </span>
          <Plane className="h-4 w-4 text-white/90" aria-hidden />
        </div>
        <div className="mt-3 flex items-center gap-3 text-white">
          <span className="font-display text-3xl font-semibold">{homeCode}</span>
          <span className="flex-1 border-t border-dashed border-white/40" />
          <Plane className="h-4 w-4 rotate-90 text-white/70" aria-hidden />
          <span className="flex-1 border-t border-dashed border-white/40" />
          <span className="font-display text-3xl font-semibold">{code}</span>
        </div>
        <div className="mt-1 flex items-center justify-between font-body text-xs text-white/75">
          <span>{trip.homeCity || "Home"}</span>
          <span>{trip.cityName}</span>
        </div>
      </div>

      {/* Stub — white, data */}
      <div className="grid grid-cols-3 gap-3 bg-white px-6 py-4">
        <div>
          <p className="font-body text-[11px] font-medium uppercase tracking-wider text-ink/45">
            Departs
          </p>
          <p className="mt-0.5 font-body text-sm font-semibold text-ink">{trip.tripDate}</p>
        </div>
        <div>
          <p className="font-body text-[11px] font-medium uppercase tracking-wider text-ink/45">
            Countdown
          </p>
          <p className="mt-0.5 font-body text-sm font-semibold text-primary">
            {countdownHeadline(days)}
          </p>
        </div>
        <div>
          <p className="font-body text-[11px] font-medium uppercase tracking-wider text-ink/45">
            Prep
          </p>
          <p className="mt-0.5 font-body text-sm font-semibold text-ink">
            {prog.done} of {prog.total} ready
          </p>
        </div>
        <div className="col-span-3">
          <div className="h-2 w-full overflow-hidden rounded-pill bg-fill">
            <div
              className="h-full rounded-pill bg-primary transition-all duration-500"
              style={{ width: `${prog.percent}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
