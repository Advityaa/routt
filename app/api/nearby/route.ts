import { NextResponse } from "next/server";

/** LOCATION-FIRST real venues via Overpass (OSM). No cities, no bboxes — pure
 *  coords+radius, works anywhere. Server-side; cached per rounded coord+radius
 *  (15 min) to respect Overpass etiquette; 12s timeout; honest failures. */
export const dynamic = "force-dynamic";
const cache = new Map<string, { at: number; body: unknown }>();
const toRad = (d: number) => (d * Math.PI) / 180;
const dist = (a: number, b: number, c: number, d: number) => Math.round(2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(Math.sin(toRad(c - a) / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(toRad(d - b) / 2) ** 2))));

const CAT: [RegExp, string][] = [[/restaurant|fast_food|food_court/, "eat"], [/cafe|ice_cream/, "eat"], [/bar|pub|biergarten|nightclub/, "drink"], [/attraction|museum|viewpoint|gallery|artwork|zoo|theme_park/, "see"], [/mall|supermarket|department_store|marketplace|clothes|books|gift/, "shop"]];

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat")), lng = Number(q.get("lng"));
  const radius = Math.min(5000, Number(q.get("radius") ?? 2000));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radius}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 15 * 60_000) return NextResponse.json(hit.body);

  const ql = `[out:json][timeout:12];nwr(around:${radius},${lat},${lng})["amenity"~"restaurant|cafe|bar|pub|fast_food|nightclub|food_court|ice_cream"];out center 300;
nwr(around:${radius},${lat},${lng})["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park"];out center 100;
nwr(around:${radius},${lat},${lng})["shop"~"mall|supermarket|department_store|marketplace|books|gift"];out center 100;`;
  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST", body: "data=" + encodeURIComponent(ql),
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Routt/0.1 (travel app; aggarwal.adv@northeastern.edu)" },
      signal: AbortSignal.timeout(14000),
    });
    if (!r.ok) throw new Error(`overpass ${r.status}`);
    const j = (await r.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
    const seen = new Set<string>();
    const venues = j.elements.map((e) => {
      const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
      if (la == null || lo == null) return null;
      const t = e.tags ?? {};
      const raw = t.amenity ?? t.tourism ?? t.shop ?? "";
      const category = CAT.find(([re]) => re.test(raw))?.[1] ?? "see";
      return {
        id: `osm-${e.type}/${e.id}`, name: t.name ?? null, unnamed: !t.name,
        category, raw, lat: la, lng: lo, distance_m: dist(lat, lng, la, lo),
        area: t["addr:suburb"] ?? t["addr:street"] ?? t["addr:city"] ?? null,
        cuisine: t.cuisine ?? null, source: "osm", attribution: "© OpenStreetMap contributors (ODbL)",
      };
    }).filter((v): v is NonNullable<typeof v> => Boolean(v))
      .filter((v) => { const k = `${v.name}|${v.category}`; if (v.name && seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.distance_m - b.distance_m);
    const body = { radius, count: venues.length, named: venues.filter((v) => !v.unnamed).length, byCategory: venues.reduce<Record<string, number>>((m, v) => ((m[v.category] = (m[v.category] ?? 0) + 1), m), {}), venues };
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (err) { return NextResponse.json({ error: String(err).slice(0, 80) }, { status: 502 }); }
}
