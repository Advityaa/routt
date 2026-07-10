import { NextResponse } from "next/server";
import type { Event, EventType } from "@/lib/types";

/**
 * Events adapter endpoint — ONE interface, per-region sources:
 *  • UAE (countryCode=AE): REAL — Ticketmaster Discovery API (confirmed AE
 *    coverage; TH/VN/SG/LK/ID are NOT covered per their country list).
 *  • Everywhere else: curated/editorial layer (the client falls back to it).
 *
 * Key stays server-side (TICKETMASTER_KEY). Quota respect (5k/day, 5 req/s):
 * responses cached 6h per region-week, so worst case is ~4 upstream calls/day.
 */
export const dynamic = "force-dynamic";
const CACHE_TTL = 6 * 3_600_000;
const cache = new Map<string, { at: number; body: unknown }>();

const inUAE = (lat: number, lng: number) => lat >= 22 && lat <= 26.6 && lng >= 51 && lng <= 56.6;

const SEGMENT_TO_TYPE: Record<string, EventType> = {
  music: "music", sports: "sport", "arts & theatre": "art", film: "culture", miscellaneous: "culture",
};

interface TMEvent {
  id: string; name: string; url?: string;
  dates?: { start?: { dateTime?: string; localDate?: string; localTime?: string } };
  classifications?: { segment?: { name?: string } }[];
  _embedded?: { venues?: { name?: string; location?: { latitude?: string; longitude?: string } }[] };
}

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat")), lng = Number(q.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });

  if (!inUAE(lat, lng)) return NextResponse.json({ source: "curated", events: null }); // client uses editorial layer

  const key = process.env.TICKETMASTER_KEY;
  if (!key) return NextResponse.json({ source: "curated", events: null, note: "TICKETMASTER_KEY not set" });

  const week = Math.floor(Date.now() / (7 * 86_400_000));
  const cacheKey = `AE-${week}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL) return NextResponse.json(hit.body);

  try {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 86_400_000);
    const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}&countryCode=AE&size=40&sort=date,asc&startDateTime=${iso(now)}&endDateTime=${iso(end)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`TM ${r.status}`);
    const j = (await r.json()) as { _embedded?: { events?: TMEvent[] } };
    const events: Event[] = (j._embedded?.events ?? []).map((e) => {
      const venue = e._embedded?.venues?.[0];
      const seg = e.classifications?.[0]?.segment?.name?.toLowerCase() ?? "";
      return {
        id: `tm-${e.id}`,
        name: e.name,
        type: SEGMENT_TO_TYPE[seg] ?? "culture",
        venue: venue?.name ?? "Dubai",
        lat: Number(venue?.location?.latitude ?? 25.2),
        lng: Number(venue?.location?.longitude ?? 55.27),
        dateISO: e.dates?.start?.dateTime ?? `${e.dates?.start?.localDate}T${e.dates?.start?.localTime ?? "19:00:00"}`,
        ticketUrl: e.url ?? "",
      };
    });
    const body = { source: "ticketmaster", attribution: "Events via Ticketmaster Discovery", count: events.length, events };
    cache.set(cacheKey, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (err) {
    // Never break the screen on upstream failure — fall back to curated.
    return NextResponse.json({ source: "curated", events: null, note: String(err).slice(0, 80) });
  }
}
