import "./guard";

/** Small fetch helper: timeout + JSON, returns null on any failure (adapters
 * treat a failed source as "absent" rather than crashing the whole request). */
export async function getJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      console.warn(`[source] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[source] request failed for ${url}:`, (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
