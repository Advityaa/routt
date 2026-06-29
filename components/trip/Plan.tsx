"use client";

import { useRouter } from "next/navigation";
import type { CatalogueEntry, TripDestination } from "@/lib/trip-types";
import TripSetup, { type TripDraft } from "./TripSetup";
import Countdown from "./Countdown";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayISO(): string {
  const n = new Date();
  const m = `${n.getMonth() + 1}`.padStart(2, "0");
  const d = `${n.getDate()}`.padStart(2, "0");
  return `${n.getFullYear()}-${m}-${d}`;
}

/**
 * Orchestrates /plan. The plan (destination + date) lives in the URL so it's
 * shareable and bookmarkable with no account or database. Check-off state is
 * the only thing kept locally (in Countdown, via localStorage).
 */
export default function Plan({
  catalogue,
  destination,
  requestedSlug,
  date,
}: {
  catalogue: CatalogueEntry[];
  /** Resolved verified data for the requested slug, or null if not live. */
  destination: TripDestination | null;
  requestedSlug: string | null;
  date: string | null;
}) {
  const router = useRouter();

  const start = (d: TripDraft) =>
    router.push(`/plan?dest=${encodeURIComponent(d.destination)}&date=${encodeURIComponent(d.tripDate)}`);
  const reset = () => router.push("/plan");

  // A valid, live plan: we have verified data AND a well-formed date.
  if (destination && date && DATE_RE.test(date)) {
    return <Countdown destination={destination} tripDateISO={date} onReset={reset} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <TripSetup
        catalogue={catalogue}
        initial={{ destination: requestedSlug ?? "", tripDate: date && DATE_RE.test(date) ? date : "" }}
        onStart={start}
        todayISO={todayISO()}
      />
    </div>
  );
}
