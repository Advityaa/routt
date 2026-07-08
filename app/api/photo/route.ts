import { GOOGLE_PLACES_KEY, hasGoogle } from "@/lib/sources/server/env";

/**
 * GET /api/photo?ref=<google photo_reference>
 *
 * Proxies Google Place Photos so the API key stays server-side — the browser
 * only ever sees this same-origin URL. Responses are aggressively cached
 * (photo_references are stable): browser + CDN for 24h, stale for 7 days.
 */
export const dynamic = "force-dynamic";

const PHOTO = "https://maps.googleapis.com/maps/api/place/photo";
const MAX_WIDTH = 800;

export async function GET(req: Request): Promise<Response> {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return new Response("missing ref", { status: 400 });
  if (!hasGoogle()) return new Response("photo source not configured", { status: 503 });

  const upstream = await fetch(
    `${PHOTO}?maxwidth=${MAX_WIDTH}&photo_reference=${encodeURIComponent(ref)}&key=${GOOGLE_PLACES_KEY}`,
    { redirect: "follow" }, // Google 302s to the actual image
  );
  if (!upstream.ok || !upstream.body) return new Response("photo unavailable", { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
