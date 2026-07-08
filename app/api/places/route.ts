import type { Category } from "@/lib/types";
import { resolveArea, configuredSources, type SourceMode } from "@/lib/sources/server/pipeline";
import { USE_MOCK } from "@/lib/sources/config";

/**
 * GET /api/places?category=eat&lat=..&lng=..[&live=1|0]
 *
 * The client calls this; the server calls the providers. API keys never leave
 * the server. `live=1` forces real sources, `live=0` forces mock, otherwise the
 * USE_MOCK env default decides — so the same endpoint compares mock vs real.
 */
export const dynamic = "force-dynamic";

const CATEGORIES = new Set<Category>(["eat", "drink", "shop", "see"]);

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as Category | null;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const live = searchParams.get("live");

  if (!category || !CATEGORIES.has(category) || Number.isNaN(lat) || Number.isNaN(lng)) {
    return Response.json(
      { error: "required: category (eat|drink|shop|see), lat, lng" },
      { status: 400 },
    );
  }

  const mode: SourceMode = live === "1" ? "real" : live === "0" ? "mock" : USE_MOCK ? "mock" : "real";
  const places = await resolveArea(mode, category, lat, lng);

  return Response.json({
    mode,
    category,
    count: places.length,
    configured: configuredSources(), // which real sources have keys (diagnostics)
    places,
  });
}
