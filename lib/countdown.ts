import type { TripTask } from "./trip-data";

/**
 * The countdown engine. Pure logic: it turns (trip date − today) and each
 * task's lead time into an urgency state. It asserts no volatile facts — it
 * only sequences tasks and phrases honest timing.
 */

export type UrgencyState = "do-now" | "coming-up" | "later" | "done";

const DAY_MS = 86_400_000;

/** Default nudge window (days) when a task doesn't specify one. */
const DEFAULT_NUDGE_DAYS = 14;

/** Whole days from `now` (date-only) until the trip date (YYYY-MM-DD). */
export function daysUntilTrip(tripDateISO: string, now: Date = new Date()): number {
  const [y, m, d] = tripDateISO.split("-").map(Number);
  const trip = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((trip - today) / DAY_MS);
}

/** Urgency for one task given days-until-trip and whether it's checked off. */
export function taskState(
  task: TripTask,
  daysUntil: number,
  done: boolean
): UrgencyState {
  if (done) return "done";
  const nudge = task.nudgeWindowDays ?? DEFAULT_NUDGE_DAYS;
  // Past the start-by point (or trip already here) → must act now.
  if (daysUntil <= task.leadTimeDays) return "do-now";
  // Inside the nudge window before the start-by point → on the radar.
  if (daysUntil <= task.leadTimeDays + nudge) return "coming-up";
  return "later";
}

/**
 * The honest timing line for time-sensitive tasks (esp. visa). Returns null
 * when there's nothing useful to say. Never a yes/no verdict on the outcome.
 */
export function leadLine(task: TripTask, daysUntil: number): string | null {
  if (!task.processingDays) return null;
  const p = task.processingDays;
  if (daysUntil < 0) return "Your trip date has passed.";
  if (daysUntil < p) {
    return `Only ${daysUntil} day${daysUntil === 1 ? "" : "s"} left and this usually takes ~${p} days. Tight — look into expedited options.`;
  }
  if (daysUntil <= p + 7) {
    return `You have ${daysUntil} days and this usually takes ~${p} days. Cutting it close — start today.`;
  }
  return `You have ${daysUntil} days. This usually takes ~${p} days, so you're fine — start now to be safe.`;
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

/** Display order for the urgency groups. */
export const URGENCY_ORDER: UrgencyState[] = ["do-now", "coming-up", "later", "done"];

export const URGENCY_LABEL: Record<UrgencyState, string> = {
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
  const weeks = Math.round(daysUntil / 7);
  if (daysUntil < 60) return `${weeks} weeks to go`;
  const months = Math.round(daysUntil / 30);
  return `${months} months to go`;
}
