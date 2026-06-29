"use client";

import {
  getPartner,
  trackAffiliateClick,
  trackHandoffClick,
} from "@/lib/affiliate";
import {
  URGENCY_LABEL,
  taskState,
  visaTimingWarning,
  whenToDo,
  type UrgencyState,
} from "@/lib/countdown";
import type { FactRanges, TripTask } from "@/lib/trip-types";
import ForexCalculator from "./ForexCalculator";

const BADGE: Record<UrgencyState, string> = {
  overdue: "border-coral/40 bg-coral/10 text-coral",
  "do-now": "border-coral/30 bg-coral/10 text-coral",
  "coming-up": "border-primary/30 bg-fill text-navy",
  later: "border-hairline bg-fill/40 text-ink/50",
  done: "border-primary/30 bg-primary/10 text-primary",
};

export default function TaskItem({
  task,
  destination,
  tripDateISO,
  daysUntil,
  done,
  onToggle,
}: {
  task: TripTask;
  destination: string;
  tripDateISO: string;
  daysUntil: number;
  done: boolean;
  onToggle: () => void;
}) {
  const state = taskState(task, daysUntil, done);
  const warning = !done ? visaTimingWarning(task, daysUntil) : null;

  return (
    <div className="rounded-card border border-hairline bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center p-2"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
              done
                ? "border-primary bg-primary text-white"
                : "border-hairline bg-fill/50 text-transparent hover:border-primary/50"
            }`}
          >
            ✓
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`rounded-pill border px-2.5 py-0.5 font-body text-xs font-semibold ${BADGE[state]}`}
            >
              {URGENCY_LABEL[state]}
            </span>
          </div>

          <h3
            className={`mt-2 font-body text-base font-semibold ${
              done ? "text-ink/50 line-through" : "text-ink"
            }`}
          >
            {task.title}
          </h3>

          {!done ? (
            <p className="mt-1 font-body text-sm font-medium text-primary/80">
              {whenToDo(task, tripDateISO)}
            </p>
          ) : null}

          <p className="mt-1.5 font-body text-sm leading-relaxed text-ink/65">
            {task.why}
          </p>

          {warning ? (
            <p className="mt-2 rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 font-body text-sm font-semibold text-coral">
              {warning}
            </p>
          ) : null}

          {task.factsRange ? <FactRangesBlock facts={task.factsRange} /> : null}

          {!done ? (
            task.category === "money" && task.partnerId ? (
              // The money task carries the forex calculator, whose CTA is the
              // commercial handoff — so we don't also render the plain button.
              <ForexCalculator partnerId={task.partnerId} destination={destination} />
            ) : (
              <Handoff task={task} destination={destination} />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

const FACT_LABELS: Record<keyof FactRanges, string> = {
  standardProcessing: "Standard processing",
  expressProcessing: "Express option",
  feeRangeINR: "Typical fee",
  applyAheadRecommendation: "When to apply",
};

/** Honest "what to expect" — ranges, never a single asserted figure. */
function FactRangesBlock({ facts }: { facts: FactRanges }) {
  const entries = (Object.keys(FACT_LABELS) as (keyof FactRanges)[])
    .filter((k) => facts[k])
    .map((k) => [FACT_LABELS[k], facts[k] as string] as const);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-hairline bg-fill/30 px-4 py-3">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
        What to expect — ranges, not a quote
      </p>
      <dl className="mt-2 space-y-1.5">
        {entries.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="shrink-0 font-body text-sm font-semibold text-ink/70 sm:w-40">
              {label}
            </dt>
            <dd className="font-body text-sm text-ink/70">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The honest handoff: government source for risky items, partner for commercial. */
function Handoff({ task, destination }: { task: TripTask; destination: string }) {
  // Commercial → the central affiliate map (real URL + tracked click).
  if (task.handoffType === "commercial" && task.partnerId) {
    const partner = getPartner(task.partnerId);
    return (
      <a
        href={partner.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackAffiliateClick({ partner, destination })}
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-coral px-5 font-body text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
      >
        {task.handoffLabel ?? `Get ${partner.name}`} <span aria-hidden>→</span>
      </a>
    );
  }

  // Authoritative → neutral style, never an affiliate.
  if (task.handoffType === "authoritative" && task.handoffURL) {
    return (
      <a
        href={task.handoffURL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackHandoffClick({ type: "authoritative", category: task.category, destination })
        }
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-navy bg-white px-5 font-body text-sm font-semibold text-navy transition-colors hover:bg-fill/50"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
        {task.handoffLabel ?? "Official source"} <span aria-hidden>↗</span>
      </a>
    );
  }

  // Informational → no button; the "why" text is the advice.
  return null;
}
