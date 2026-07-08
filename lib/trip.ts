/** v1 trip store (localStorage) — destination + dates, optionally auto-derived
 *  from a flight. Powers tripPhase (planning/preflight/onground/post), the
 *  countdown, and future packing/canvas config. */
export interface Trip {
  destination: string;
  startISO: string; // arrival/first day (YYYY-MM-DD)
  endISO?: string;
  flight?: { number: string; date: string; origin?: string; dest?: string; depTime?: string; arrTime?: string; source: string };
}
const KEY = "routt.trip";
export function getTrip(): Trip | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
export function setTrip(t: Trip) { localStorage.setItem(KEY, JSON.stringify(t)); }
export function clearTrip() { localStorage.removeItem(KEY); }
