import { NextResponse } from "next/server";
import { getWeather } from "@/lib/packing/weather";

/**
 * Weather endpoint — calls Open-Meteo server-side and returns a normalized
 * summary. Cached per destination + date-range via the upstream fetch's
 * revalidate, plus CDN cache headers, so we don't hammer the API.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: "Invalid lat/lng/start/end" }, { status: 400 });
  }

  const summary = await getWeather(lat, lng, start, end);
  return NextResponse.json(
    { summary },
    { headers: { "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=86400" } }
  );
}
