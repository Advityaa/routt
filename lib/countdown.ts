import type { TripTask } from "./trip-types";

/**
 * The countdown engine. Pure date math: it turns (trip date − today) and each
 * task's lead time into an urgency state. It asserts no volatile facts — it
 * only sequences tasks and phrases honest timing.
 */

export type UrgencyState = "overdue" | "do-now" | "coming-up" | "later" | "done";

const DAY_MS = 86_400_000;

/** Below this many days until the trip, flag the visa task's timing risk. */
export const VISA_TIMING_THRESHOLD_DAYS = 7;

/** Show a staleness note once verified data is older than this. */
const STALE_AFTER_DAYS = 90;

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfDayUTC(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from `now` (date-only) until the trip date (YYYY-MM-DD). */
export function daysUntilTrip(tripDateISO: string, now: Date = new Date()): number {
  const [y, m, d] = tripDateISO.split("-").map(Number);
  const trip = Date.UTC(y, m - 1, d);
  return Math.round((trip - startOfDayUTC(now)) / DAY_MS);
}

/** Slack = how many days of buffer beyond the task's lead time you still have. */
export function slackDays(task: TripTask, daysUntil: number): number {
  return daysUntil - task.leadTimeDays;
}

/**
 * Urgency for one task. Driven entirely by slackDays:
 *   slack < 0        → overdue (past the safe window)
 *   0..3             → do-now  (cutting it close)
 *   4..10            → coming-up
 *   > 10             → later
 * A checked-off task is always "done".
 */
export function taskState(
  task: TripTask,
  daysUntil: number,
  done: boolean
): UrgencyState {
  if (done) return "done";
  const slack = slackDays(task, daysUntil);
  if (slack < 0) return "overdue";
  if (slack <= 3) return "do-now";
  if (slack <= 10) return "coming-up";
  return "later";
}

/** The date you should START this task by (trip date − lead time). */
export function startByDate(tripDateISO: string, leadTimeDays: number): Date {
  const [y, m, d] = tripDateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - leadTimeDays));
}

/**
 * "When to do it", phrased relative to the user's trip date, e.g.
 * "Start by ~12 Aug · about 21 days before you fly". If the start-by date has
 * already passed, says so plainly.
 */
export function whenToDo(
  task: TripTask,
  tripDateISO: string,
  now: Date = new Date()
): string {
  const start = startByDate(tripDateISO, task.leadTimeDays);
  const startMs = start.getTime();
  const todayMs = startOfDayUTC(now);
  const dateLabel = `${start.getUTCDate()} ${MONTHS_SHORT[start.getUTCMonth()]}`;
  const rel = `about ${task.leadTimeDays} day${task.leadTimeDays === 1 ? "" : "s"} before you fly`;

  if (startMs < todayMs) return `Ideally already started — do it as soon as you can (${rel})`;
  return `Start by ~${dateLabel} · ${rel}`;
}

/**
 * Visa-specific timing warning. When the trip is sooner than the standard
 * processing window, flag the RISK — never the outcome. Returns null otherwise.
 */
export function visaTimingWarning(
  task: TripTask,
  daysUntil: number
): string | null {
  if (task.category !== "visa") return null;
  if (daysUntil < 0) return "Your trip date has passed.";
  if (daysUntil < VISA_TIMING_THRESHOLD_DAYS) {
    return "Standard processing may not make it in time — you may need express, or to adjust your date. Check the official portal now.";
  }
  return null;
}

/** True when verified data is older than the staleness window. */
export function isReviewStale(
  lastReviewedYM: string | undefined,
  now: Date = new Date()
): boolean {
  if (!lastReviewedYM) return false;
  const [y, m] = lastReviewedYM.split("-").map(Number);
  if (!y || !m) return false;
  const reviewed = Date.UTC(y, m - 1, 1);
  return (startOfDayUTC(now) - reviewed) / DAY_MS > STALE_AFTER_DAYS;
}

/** "2026-06" → "June 2026". */
export function formatReviewed(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_LONG[m - 1] ?? ""} ${y}`.trim();
}

export interface CountdownProgress {
  total: number;
  done: number;
  /** 0–100, rounded. */
  percent: number;
}

export function progress(total: number, done: number): CountdownProgress {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

/** Display order for the urgency groups — most urgent first. */
export const URGENCY_ORDER: UrgencyState[] = [
  "overdue",
  "do-now",
  "coming-up",
  "later",
  "done",
];

export const URGENCY_LABEL: Record<UrgencyState, string> = {
  overdue: "Overdue — do now",
  "do-now": "Do now",
  "coming-up": "Coming up",
  later: "Later",
  done: "Done",
};

/** A short human phrase for the headline, e.g. "3 weeks to go". */
export function countdownHeadline(daysUntil: number): string {
  if (daysUntil < 0) return "Trip date has passed";
  if (daysUntil === 0) return "You leave today";
  if (daysUntil === 1) return "1 day to go";
  if (daysUntil < 14) return `${daysUntil} days to go`;
  if (daysUntil < 60) return `${Math.round(daysUntil / 7)} weeks to go`;
  return `${Math.round(daysUntil / 30)} months to go`;
}
