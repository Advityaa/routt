import { NextResponse } from "next/server";
import { nominatimReverse } from "@/lib/venues/nominatim";

/** Human area label for a coordinate via Nominatim reverse geocoding (approved
 *  source; ≤1 req/s enforced in the helper). Cached 24h per ~100m cell so the
 *  rate cap is never stressed by UI traffic. */
export const dynamic = "force-dynamic";
const cache = new Map<string, { at: number; label: string | null }>();

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat")), lng = Number(q.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 86_400_000) return NextResponse.json({ label: hit.label });
  const label = await nominatimReverse(lat, lng).catch(() => null);
  cache.set(key, { at: Date.now(), label });
  return NextResponse.json({ label });
}
