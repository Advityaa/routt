import { NextResponse } from "next/server";
import { searchExperiences, viatorConfigured } from "@/lib/experiences/viator";

/** Experiences adapter endpoint (provider-agnostic; Viator first, affiliate).
 *  No key → source:"curated" and the Do world keeps its curated catalogue. */
export const dynamic = "force-dynamic";
const cache = new Map<string, { at: number; body: unknown }>();

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const city = q.get("city") ?? "Bangkok";
  const country = q.get("country") ?? "";
  if (!viatorConfigured()) return NextResponse.json({ source: "curated", note: "VIATOR_API_KEY not set" });
  const key = `${city}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 3_600_000) return NextResponse.json(hit.body);
  try {
    const experiences = await searchExperiences(city, country);
    const body = { source: "viator", count: experiences.length, attribution: "Experiences via Viator (affiliate)", experiences };
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ source: "curated", note: String(e).slice(0, 80) });
  }
}
