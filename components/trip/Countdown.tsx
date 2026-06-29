"use client";

import { useEffect, useMemo, useState } from "react";
import {
  countdownHeadline,
  daysUntilTrip,
  formatReviewed,
  isReviewStale,
  progress,
  taskState,
  URGENCY_LABEL,
  URGENCY_ORDER,
  type UrgencyState,
} from "@/lib/countdown";
import type { TripDestination, TripTask } from "@/lib/trip-types";
import TaskItem from "./TaskItem";

export default function Countdown({
  destination: dest,
  tripDateISO,
  onReset,
}: {
  destination: TripDestination;
  tripDateISO: string;
  onReset: () => void;
}) {
  // Checkbox state lives in the user's own browser, keyed per (trip, date).
  // Non-sensitive task-completion only — never any personal/document data.
  const storageKey = `routt.done.${dest.slug}.${tripDateISO}`;
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setDone(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDone([]);
    }
  }, [storageKey]);

  const toggle = (taskId: string) => {
    setDone((prev) => {
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable — in-memory still works this session */
      }
      return next;
    });
  };

  const days = daysUntilTrip(tripDateISO);
  const doneSet = useMemo(() => new Set(done), [done]);

  // Group by urgency, then sort longest-lead-first within each group.
  const groups = useMemo(() => {
    const byState: Record<UrgencyState, TripTask[]> = {
      overdue: [],
      "do-now": [],
      "coming-up": [],
      later: [],
      done: [],
    };
    for (const task of dest.tasks) {
      byState[taskState(task, days, doneSet.has(task.id))].push(task);
    }
    for (const state of URGENCY_ORDER) {
      byState[state].sort((a, b) => b.leadTimeDays - a.leadTimeDays);
    }
    return byState;
  }, [dest.tasks, days, doneSet]);

  const prog = progress(dest.tasks.length, done.length);
  const stale = isReviewStale(dest.lastReviewed);

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
            onClick={onReset}
            className="inline-flex min-h-[44px] items-center font-body text-sm font-semibold text-ink/50 hover:text-navy"
          >
            Change trip
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between font-body text-sm">
            <span className="font-semibold text-ink">
              {prog.done} of {prog.total} sorted
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

      {/* Honesty-about-staleness note */}
      {dest.lastReviewed && stale ? (
        <p className="mt-4 rounded-card border border-hairline bg-fill/40 px-4 py-3 font-body text-xs leading-relaxed text-ink/55">
          Info last reviewed {formatReviewed(dest.lastReviewed)} — rules change,
          so verify visa details on the official portal before you rely on them.
        </p>
      ) : (
        <p className="mt-4 font-body text-xs text-ink/45">
          We show ranges, never a fixed quote. Always confirm visa details on the
          official portal.
        </p>
      )}

      {/* Grouped + sorted tasks */}
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
                    tripDateISO={tripDateISO}
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
