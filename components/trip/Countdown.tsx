"use client";

import { useEffect, useMemo, useState } from "react";
import {
  countdownHeadline,
  daysUntilTrip,
  progress,
  taskState,
  URGENCY_LABEL,
  URGENCY_ORDER,
  type UrgencyState,
} from "@/lib/countdown";
import { getTripDestination } from "@/lib/trip-data";
import TripSetup, { type TripDraft } from "./TripSetup";
import TaskItem from "./TaskItem";

const STORAGE_KEY = "routt.trip.v1";

interface SavedTrip extends TripDraft {
  done: string[];
}

function todayISO(): string {
  const n = new Date();
  const m = `${n.getMonth() + 1}`.padStart(2, "0");
  const d = `${n.getDate()}`.padStart(2, "0");
  return `${n.getFullYear()}-${m}-${d}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-06" → "June 2026". */
function formatReviewed(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1] ?? ""} ${y}`.trim();
}

export default function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [trip, setTrip] = useState<SavedTrip | null>(null);

  // Load any saved trip on the client only (avoids hydration mismatch).
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTrip(JSON.parse(raw) as SavedTrip);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = (next: SavedTrip | null) => {
    setTrip(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — in-memory still works for the session */
    }
  };

  const start = (draft: TripDraft) => persist({ ...draft, done: [] });
  const reset = () => persist(null);

  const toggle = (taskId: string) => {
    if (!trip) return;
    const has = trip.done.includes(taskId);
    persist({
      ...trip,
      done: has
        ? trip.done.filter((id) => id !== taskId)
        : [...trip.done, taskId],
    });
  };

  const dest = trip ? getTripDestination(trip.destination) : undefined;
  const days = trip ? daysUntilTrip(trip.tripDate) : 0;

  const groups = useMemo(() => {
    if (!dest || !trip) return null;
    const doneSet = new Set(trip.done);
    const byState: Record<UrgencyState, typeof dest.tasks> = {
      "do-now": [],
      "coming-up": [],
      later: [],
      done: [],
    };
    for (const task of dest.tasks) {
      byState[taskState(task, days, doneSet.has(task.id))].push(task);
    }
    return byState;
  }, [dest, trip, days]);

  // Pre-hydration: render nothing structural to keep SSR + client in sync.
  if (!mounted) {
    return <div className="min-h-[60vh]" aria-hidden />;
  }

  if (!trip || !dest || !groups) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <TripSetup initial={trip} onStart={start} todayISO={todayISO()} />
      </div>
    );
  }

  const doneSet = new Set(trip.done);
  const prog = progress(dest.tasks.length, trip.done.length);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="rounded-card border border-hairline bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl" aria-hidden>
                {dest.flag}
              </span>
              <span className="font-body text-sm font-medium uppercase tracking-wider text-primary/70">
                {dest.country}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
              {dest.title}
            </h1>
            <p className="mt-1 font-body text-lg font-semibold text-primary">
              {countdownHeadline(days)}
            </p>
            {dest.lastReviewed ? (
              <p className="mt-1 inline-flex items-center gap-1.5 font-body text-xs font-medium text-ink/45">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Reviewed {formatReviewed(dest.lastReviewed)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center font-body text-sm font-semibold text-ink/50 hover:text-navy"
          >
            Change trip
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between font-body text-sm">
            <span className="font-semibold text-ink">
              {prog.done} of {prog.total} done
            </span>
            <span className="text-ink/50">{prog.percent}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-pill bg-fill">
            <div
              className="h-full rounded-pill bg-primary transition-all duration-500"
              style={{ width: `${prog.percent}%` }}
            />
          </div>
        </div>

        {dest.note ? (
          <p className="mt-5 rounded-card border border-hairline bg-fill/40 px-4 py-3 font-body text-sm leading-relaxed text-navy">
            {dest.note}
          </p>
        ) : null}
      </div>

      {/* Data-confidence notice: verified destinations vs placeholder stubs */}
      {dest.lastReviewed ? (
        <p className="mt-4 font-body text-xs text-ink/45">
          Human-reviewed {formatReviewed(dest.lastReviewed)}. Visa rules change —
          always confirm the details on the official portal before you rely on
          them. We show ranges, never a fixed quote.
        </p>
      ) : (
        <p className="mt-4 font-body text-xs text-ink/40">
          v1 preview — this destination&apos;s timings and links are placeholders
          pending a human-verified data pass. Always confirm visa details on the
          official portal.
        </p>
      )}

      {/* Grouped tasks */}
      <div className="mt-8 space-y-10">
        {URGENCY_ORDER.map((state) => {
          const tasks = groups[state];
          if (tasks.length === 0) return null;
          return (
            <section key={state}>
              <h2 className="font-display text-xl font-semibold text-ink">
                {URGENCY_LABEL[state]}
                <span className="ml-2 font-body text-sm font-normal text-ink/40">
                  {tasks.length}
                </span>
              </h2>
              <div className="mt-4 space-y-3">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    destination={dest.slug}
                    daysUntil={days}
                    done={doneSet.has(task.id)}
                    onToggle={() => toggle(task.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Optional expectation-setting reference (e.g. typical cab fares) */}
      {dest.reference ? (
        <div className="mt-10 rounded-card border border-hairline bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">
            {dest.reference.label}
          </h2>
          <dl className="mt-4 divide-y divide-hairline">
            {dest.reference.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2.5">
                <dt className="font-body text-sm text-ink/70">{row.label}</dt>
                <dd className="font-body text-sm font-semibold text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          {dest.reference.note ? (
            <p className="mt-3 font-body text-xs text-ink/40">
              {dest.reference.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
