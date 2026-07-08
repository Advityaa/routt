import { NextResponse } from "next/server";

/**
 * Current weather via Open-Meteo (free, no key), proxied + cached server-side.
 * Cache: 15 min per ~1km cell — weather doesn't move faster, and the client
 * stays non-blocking. No user identity or precise location is stored.
 */
export const dynamic = "force-dynamic";
const TTL = 15 * 60_000;
const cache = new Map<string, { at: number; body: unknown }>();

// WMO weather codes → plain condition words.
function condition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
}

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat")), lng = Number(q.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });

  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.body);

  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(4000) },
    );
    const j = await r.json();
    const body = {
      tempC: Math.round(j?.current?.temperature_2m ?? NaN),
      condition: condition(Number(j?.current?.weather_code ?? 99)),
    };
    if (!Number.isFinite(body.tempC)) throw new Error("bad payload");
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "weather unavailable" }, { status: 503 }); // non-blocking: client just omits it
  }
}
