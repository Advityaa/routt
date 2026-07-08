/**
 * Small pure helpers for the place-detail screen. Kept separate so the
 * plain-language logic is easy to reason about and unit-test.
 */

const THB_PER_USD = 36.5; // v1 fixed rate; later a live forex source

const fmtNum = (n: number) => n.toLocaleString("en-US");

/** Format a 0–23 hour as "8am" / "12pm" / "12am". */
export function fmtHour(hour: number): string {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  const period = h < 12 ? "am" : "pm";
  const x = h % 12 === 0 ? 12 : h % 12;
  return `${x}${period}`;
}

/** Format an hour range compactly: "8–10pm", "9pm–1am". */
export function fmtHourRange(start: number, end: number): string {
  const ps = start % 24 < 12 ? "am" : "pm";
  const pe = end % 24 < 12 ? "am" : "pm";
  const xs = start % 12 === 0 ? 12 : start % 12;
  const xe = end % 12 === 0 ? 12 : end % 12;
  return ps === pe ? `${xs}–${xe}${pe}` : `${xs}${ps}–${xe}${pe}`;
}

/**
 * Convert a home-currency estimate string into a local (THB) one by replacing
 * any "$N" / "$N–M" amounts. Returns null when there's nothing numeric to
 * convert (e.g. "Free", "market prices").
 */
export function toLocalTHB(home: string, rate = THB_PER_USD): string | null {
  if (!/\d/.test(home)) return null;
  return home.replace(/\$\s?(\d+)(?:\s?[–-]\s?(\d+))?/g, (_m, a: string, b?: string) => {
    const lo = Math.round((+a * rate) / 10) * 10;
    if (b) {
      const hi = Math.round((+b * rate) / 10) * 10;
      return `฿${fmtNum(lo)}–${fmtNum(hi)}`;
    }
    return `฿${fmtNum(lo)}`;
  });
}

/**
 * Plain-language "when to go" takeaway from a 24h busyness curve, e.g.
 * "Quiet before 6pm, packed 8–10pm — go early to beat it."
 */
export function summarizeWhenToGo(busyByHour: number[]): string {
  if (!busyByHour?.length) return "";
  const PACKED = 0.55;
  const LIVE = 0.3;

  let peak = 0;
  for (let i = 1; i < 24; i++) if (busyByHour[i] > busyByHour[peak]) peak = i;
  if (busyByHour[peak] < PACKED) return "No real rush — pleasant most open hours.";

  let start = peak;
  let end = peak;
  while (start > 0 && busyByHour[start - 1] >= PACKED) start--;
  while (end < 23 && busyByHour[end + 1] >= PACKED) end++;

  let firstLive = -1;
  for (let i = 0; i < 24; i++) {
    if (busyByHour[i] >= LIVE) {
      firstLive = i;
      break;
    }
  }

  const parts: string[] = [];
  if (firstLive >= 0 && firstLive < start) parts.push(`quiet before ${fmtHour(firstLive)}`);
  parts.push(`packed ${fmtHourRange(start, end)}`);

  const advice = start >= 18 ? "go early to beat it" : end <= 13 ? "beat the lunch rush" : "";
  const sentence = advice ? `${parts.join(", ")} — ${advice}` : parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}
