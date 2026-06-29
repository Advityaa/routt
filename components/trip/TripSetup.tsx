"use client";

import { useState } from "react";
import type { CatalogueEntry } from "@/lib/trip-types";

export interface TripDraft {
  destination: string;
  tripDate: string; // YYYY-MM-DD
}

/**
 * The setup: passport (India, fixed for v1), destination, trip date. On submit
 * it hands a TripDraft up to be written to the URL (shareable, no account).
 */
export default function TripSetup({
  catalogue,
  initial,
  onStart,
  todayISO,
}: {
  catalogue: CatalogueEntry[];
  initial?: TripDraft | null;
  onStart: (draft: TripDraft) => void;
  todayISO: string;
}) {
  const liveSlugs = new Set(catalogue.filter((c) => c.live).map((c) => c.slug));
  const initialLive =
    initial?.destination && liveSlugs.has(initial.destination)
      ? initial.destination
      : "";

  const [destination, setDestination] = useState(initialLive);
  const [tripDate, setTripDate] = useState(initial?.tripDate ?? "");
  const [error, setError] = useState<string | null>(null);

  const requestedComingSoon =
    initial?.destination && !liveSlugs.has(initial.destination)
      ? catalogue.find((c) => c.slug === initial.destination)
      : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return setError("Pick a destination we're live in.");
    if (!liveSlugs.has(destination)) return setError("That destination is coming soon.");
    if (!tripDate) return setError("Add your trip start date.");
    if (tripDate < todayISO) return setError("That date is in the past.");
    setError(null);
    onStart({ destination, tripDate });
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-lg rounded-card border border-hairline bg-white p-6 shadow-soft sm:p-8"
    >
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Plan your first trip
      </h1>
      <p className="mt-2 font-body text-base text-ink/60">
        Three answers and we&apos;ll build your countdown — what to handle, and
        when.
      </p>

      {requestedComingSoon ? (
        <p className="mt-4 rounded-card border border-hairline bg-fill/40 px-4 py-3 font-body text-sm text-navy">
          {requestedComingSoon.flag} {requestedComingSoon.title} is coming soon —
          Dubai is the only fully-verified plan right now.
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        <div>
          <span className="font-body text-sm font-semibold text-ink">Passport</span>
          <div className="mt-2 flex min-h-[44px] items-center gap-2 rounded-2xl border border-hairline bg-fill/40 px-4 font-body text-base text-ink/70">
            <span aria-hidden>🇮🇳</span> India
            <span className="ml-auto font-body text-xs text-ink/40">more soon</span>
          </div>
        </div>

        <div>
          <label htmlFor="destination" className="font-body text-sm font-semibold text-ink">
            Destination
          </label>
          <select
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-2 min-h-[44px] w-full rounded-2xl border border-hairline bg-white px-4 font-body text-base text-ink focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              Where are you headed?
            </option>
            {catalogue.map((d) => (
              <option key={d.slug} value={d.slug} disabled={!d.live}>
                {d.flag} {d.title}
                {d.live ? "" : " — coming soon"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tripDate" className="font-body text-sm font-semibold text-ink">
            Trip start date
          </label>
          <input
            id="tripDate"
            type="date"
            min={todayISO}
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="mt-2 min-h-[44px] w-full rounded-2xl border border-hairline bg-white px-4 font-body text-base text-ink focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 font-body text-sm font-medium text-coral">{error}</p>
      ) : null}

      <button
        type="submit"
        className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-pill bg-coral px-6 font-body text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
      >
        Build my countdown
      </button>
    </form>
  );
}
