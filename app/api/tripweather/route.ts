import { NextResponse } from "next/server";
/** Trip weather: Open-Meteo FORECAST if trip starts <14d out, else HISTORICAL
 *  archive for the same calendar dates last year ("typical"). Cached 1h. */
export const dynamic = "force-dynamic";
const cache = new Map<string, { at: number; body: unknown }>();
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat")), lng = Number(q.get("lng"));
  const start = q.get("start"), end = q.get("end") ?? start;
  if (!Number.isFinite(lat) || !start) return NextResponse.json({ error: "bad params" }, { status: 400 });
  const key = `${lat.toFixed(1)},${lng.toFixed(1)},${start},${end}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 3_600_000) return NextResponse.json(hit.body);
  const daysOut = (Date.parse(start) - Date.now()) / 86_400_000;
  const forecast = daysOut < 14;
  const [s, e] = forecast ? [start, end] : [start.replace(/^\d{4}/, String(new Date().getFullYear() - 1)), end!.replace(/^\d{4}/, String(new Date().getFullYear() - 1))];
  const base = forecast ? "https://api.open-meteo.com/v1/forecast" : "https://archive-api.open-meteo.com/v1/archive";
  try {
    const r = await fetch(`${base}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${s}&end_date=${e}`, { signal: AbortSignal.timeout(5000) });
    const j = await r.json();
    const hi = j?.daily?.temperature_2m_max ?? [], lo = j?.daily?.temperature_2m_min ?? [], pr = j?.daily?.precipitation_sum ?? [];
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x: number, y: number) => x + y, 0) / a.length) : NaN);
    const body = { mode: forecast ? "forecast" : "typical", avgHighC: avg(hi), avgLowC: avg(lo), rainDays: pr.filter((p: number) => p >= 1).length, days: hi.length };
    if (!Number.isFinite(body.avgHighC)) throw new Error("bad");
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch { return NextResponse.json({ error: "weather unavailable" }, { status: 503 }); }
}
