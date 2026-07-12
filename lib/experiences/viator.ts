/**
 * Viator Partner API v2 client + adapter (AFFILIATE basic tier, per spec).
 * SERVER-SIDE ONLY — key never reaches the client. Sandbox first.
 *
 * ⚠️ SCHEMA VERIFICATION PENDING: field mapping below follows the spec's
 * candidate names (title / images.variants.url / pricing.summary.fromPrice /
 * reviews.combinedAverageRating / duration / productUrl) with DEFENSIVE
 * parsing. On the FIRST live sandbox call we log one raw product (server log
 * only) — verify against docs.viator.com before production. Do not trust
 * blindly; nulls degrade gracefully in the UI.
 *
 * Compliance built in: no review TEXT is ever mapped (rating/count only until
 * the owner confirms permissions); real-time queries only (no bulk ingestion);
 * booking = affiliate redirect, never in-app.
 */
export interface Experience {
  id: string; title: string; image: string | null; city: string; country: string;
  category: string | null; rating: number | null; reviewCount: number | null;
  priceFrom: number | null; currency: string | null; priceFromConverted: string | null;
  durationText: string | null; bookingUrl: string; provider: "viator";
}

const BASE = process.env.VIATOR_ENV === "production"
  ? "https://api.viator.com/partner"
  : "https://api.sandbox.viator.com/partner";

export const viatorConfigured = () => Boolean(process.env.VIATOR_API_KEY);

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "exp-api-key": process.env.VIATOR_API_KEY ?? "",
      Accept: "application/json;version=2.0", // mandatory — omitting => 400
      "Accept-Language": "en-US",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(20000), // content endpoints are fast; 120s is for booking tiers
  });
  if (!r.ok) throw new Error(`viator ${r.status} ${path}`);
  return r.json();
}

// destination tree cached 24h (basic tier queries real-time; tree is reference data)
let destCache: { at: number; list: { destinationId: number; name: string; type: string }[] } | null = null;
export async function resolveDestinationId(cityName: string): Promise<number | null> {
  if (!destCache || Date.now() - destCache.at > 86_400_000) {
    const j = (await call("/destinations")) as { destinations?: { destinationId: number; name: string; type: string }[] };
    destCache = { at: Date.now(), list: j.destinations ?? [] };
  }
  const city = cityName.toLowerCase();
  const hit = destCache.list.find((d) => d.type === "CITY" && d.name.toLowerCase() === city)
    ?? destCache.list.find((d) => d.name.toLowerCase().includes(city));
  return hit?.destinationId ?? null;
}

let logged = false;
export async function searchExperiences(cityName: string, country: string, count = 12): Promise<Experience[]> {
  const destId = await resolveDestinationId(cityName);
  if (!destId) return [];
  const j = (await call("/products/search", {
    method: "POST",
    body: JSON.stringify({ filtering: { destination: String(destId) }, sorting: { sort: "TRAVELER_RATING", order: "DESCENDING" }, pagination: { start: 1, count }, currency: "USD" }),
  })) as { products?: Record<string, unknown>[] };
  const products = j.products ?? [];
  if (!logged && products[0]) { console.log("[viator] RAW SAMPLE (verify schema):", JSON.stringify(products[0]).slice(0, 1500)); logged = true; }
  const partner = process.env.VIATOR_CAMPAIGN ?? ""; // affiliate tracking value from partner dashboard
  return products.map((p) => {
    const g = (path: string): unknown => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], p);
    const url = (g("productUrl") as string) ?? `https://www.viator.com/tours/${g("productCode")}`;
    return {
      id: String(g("productCode") ?? ""),
      title: String(g("title") ?? ""),
      image: (g("images") as { variants?: { url?: string }[] }[] | undefined)?.[0]?.variants?.at(-1)?.url ?? null,
      city: cityName, country,
      category: null,
      rating: (g("reviews.combinedAverageRating") as number) ?? null,
      reviewCount: (g("reviews.totalReviews") as number) ?? null,
      priceFrom: (g("pricing.summary.fromPrice") as number) ?? null,
      currency: (g("pricing.currency") as string) ?? "USD",
      priceFromConverted: null, // wire Frankfurter/exchange-rates at display time
      durationText: (g("duration.fixedDurationInMinutes") as number) ? `${Math.round((g("duration.fixedDurationInMinutes") as number) / 60)} h` : null,
      bookingUrl: partner ? `${url}${url.includes("?") ? "&" : "?"}mcid=${encodeURIComponent(partner)}` : url,
      provider: "viator" as const,
    };
  }).filter((e) => e.id && e.title);
}
