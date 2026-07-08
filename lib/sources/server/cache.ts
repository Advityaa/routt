import "./guard";

/**
 * Simple server-side time-based cache to respect provider rate limits + cost.
 *
 * Keyed by (mode, category, ~1km area). TTL 24h — resolved places don't churn
 * hour to hour, so we hit the paid APIs at most once/day per area/category.
 *
 * Caveat: in-memory, per server instance. On serverless (Vercel) that means
 * per-lambda and ephemeral — good enough to blunt bursts, but production should
 * swap this for Redis / Vercel KV. That change touches only this file.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;

interface Entry {
  expires: number;
  value: unknown;
}
const store = new Map<string, Entry>();

/** mode:category:lat,lng rounded to 2dp (~1.1km bucket). */
export function areaKey(mode: string, category: string, lat: number, lng: number): string {
  return `${mode}:${category}:${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export async function cached<T>(key: string, ttlMs: number, produce: () => Promise<T> | T): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await produce();
  store.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}
