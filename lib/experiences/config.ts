import type { ExperienceProvider, ExperiencesMode } from "./types";

/**
 * Experiences are configured by env so we can flip provider / mode without code
 * changes. Defaults keep everything on the safe, buildable mock until real
 * partner credentials are approved.
 *
 *   EXPERIENCES_PROVIDER = mock | headout | viator | getyourguide | klook
 *   EXPERIENCES_MODE     = api | widget
 *   EXPERIENCES_PARTNER_ID = <affiliate/partner id appended to booking URLs>
 *   <PROVIDER>_API_KEY   = server-only secret, read inside the adapter
 */

export const EXPERIENCES_PROVIDER: ExperienceProvider =
  (process.env.EXPERIENCES_PROVIDER as ExperienceProvider) || "mock";

export const EXPERIENCES_MODE: ExperiencesMode =
  (process.env.EXPERIENCES_MODE as ExperiencesMode) || "api";

const PARTNER_ID = process.env.EXPERIENCES_PARTNER_ID || "routt";

/**
 * Append our affiliate/partner + UTM params to a provider booking URL. Applied
 * server-side so the partner id is consistent and never depends on the client.
 */
export function withTracking(url: string, ctx: { city?: string }): string {
  try {
    const u = new URL(url);
    u.searchParams.set("aff", PARTNER_ID);
    u.searchParams.set("utm_source", "routt");
    u.searchParams.set("utm_medium", "experiences");
    if (ctx.city) u.searchParams.set("utm_campaign", ctx.city);
    return u.toString();
  } catch {
    return url;
  }
}
