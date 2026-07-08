import "./guard";

/**
 * Server-side credentials. Read from process.env; NEVER exported to the client.
 * Each source degrades gracefully when its key is absent (adapter returns [] and
 * reports itself unconfigured), so the pipeline runs on whatever is available.
 */
export const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY ?? "";
export const FOURSQUARE_KEY = process.env.FOURSQUARE_KEY ?? "";
export const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID ?? "";
export const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET ?? "";
export const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT ?? "routt/0.1 (real-source adapter)";

export const hasGoogle = () => GOOGLE_PLACES_KEY.length > 0;
export const hasFoursquare = () => FOURSQUARE_KEY.length > 0;
export const hasReddit = () => REDDIT_CLIENT_ID.length > 0 && REDDIT_CLIENT_SECRET.length > 0;

/** Which real sources are actually usable right now (for diagnostics). */
export function configuredSources(): Record<string, boolean> {
  return { google: hasGoogle(), foursquare: hasFoursquare(), reddit: hasReddit() };
}
