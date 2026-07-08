import { NextResponse } from "next/server";
/**
 * Flight lookup adapter endpoint. Provider (AeroDataBox via RapidAPI free tier)
 * sits SERVER-SIDE behind this route — swappable, key never in the browser.
 * No key configured → 503 and the UI falls back to manual destination+dates,
 * so the feature works regardless. Times are ESTIMATES: the UI always says
 * "verify with your airline" — never asserted as guaranteed.
 */
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const num = q.get("number")?.replace(/\s/g, "").toUpperCase();
  const date = q.get("date");
  if (!num || !date) return NextResponse.json({ error: "number+date required" }, { status: 400 });
  const key = process.env.AERODATABOX_KEY;
  if (!key) return NextResponse.json({ error: "flight lookup not configured" }, { status: 503 });
  try {
    const r = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${num}/${date}`, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) throw new Error(String(r.status));
    const legs = (await r.json()) as { departure?: { airport?: { iata?: string }; scheduledTime?: { local?: string } }; arrival?: { airport?: { iata?: string; municipalityName?: string }; scheduledTime?: { local?: string } } }[];
    const leg = legs?.[0];
    if (!leg) return NextResponse.json({ error: "flight not found" }, { status: 404 });
    return NextResponse.json({
      origin: leg.departure?.airport?.iata ?? null,
      dest: leg.arrival?.airport?.iata ?? null,
      destination: leg.arrival?.airport?.municipalityName ?? null,
      depTime: leg.departure?.scheduledTime?.local ?? null,
      arrTime: leg.arrival?.scheduledTime?.local ?? null,
      source: "AeroDataBox",
    });
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
