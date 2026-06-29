"use client";

import { useState } from "react";
import { TRIP_DESTINATION_OPTIONS } from "@/lib/trip-data";

export interface TripDraft {
  destination: string;
  tripDate: string; // YYYY-MM-DD
}

/**
 * The three-input setup: passport (India, fixed for v1), destination, trip
 * date. Produces a TripDraft the countdown engine sequences against.
 */
export default function TripSetup({
  initial,
  onStart,
  todayISO,
}: {
  initial?: TripDraft | null;
  onStart: (draft: TripDraft) => void;
  /** Min selectable date (today), passed in so the engine + UI agree. */
  todayISO: string;
}) {
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [tripDate, setTripDate] = useState(initial?.tripDate ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return setError("Pick where you're going.");
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

      <div className="mt-6 space-y-5">
        <div>
          <label className="font-body text-sm font-semibold text-ink">
            Passport
          </label>
          <div className="mt-2 flex min-h-[44px] items-center gap-2 rounded-2xl border border-hairline bg-fill/40 px-4 font-body text-base text-ink/70">
            <span aria-hidden>🇮🇳</span> India
            <span className="ml-auto font-body text-xs text-ink/40">
              more soon
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="destination"
            className="font-body text-sm font-semibold text-ink"
          >
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
            {TRIP_DESTINATION_OPTIONS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.flag} {d.title} — {d.country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tripDate"
            className="font-body text-sm font-semibold text-ink"
          >
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
