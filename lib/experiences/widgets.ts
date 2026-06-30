/**
 * Widget-mode experiences config. GetYourGuide for now, but kept provider-
 * agnostic: pages ask the wrapper for "experiences for city X" and the wrapper
 * decides which provider widget to render, so Klook/Viator widgets (or a full
 * API path) can slot in later without touching the pages.
 */

export type WidgetProvider = "getyourguide";

/** Active widget provider (env-overridable). */
export function getWidgetProvider(): WidgetProvider {
  return (process.env.EXPERIENCES_PROVIDER as WidgetProvider) || "getyourguide";
}

/* ── GetYourGuide ──────────────────────────────────────────────────────── */

// Public — used in the client widget markup + script tag.
export const GYG_PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "FF7C5VC";
export const GYG_LOCALE = "en-US";
export const GYG_CURRENCY = "INR";
export const GYG_SCRIPT_SRC =
  "https://widget.getyourguide.com/dist/pa.umd.production.min.js";

/** GetYourGuide location ids per destination slug (from their city URLs). */
const GYG_LOCATION_IDS: Record<string, string> = {
  dubai: "173",
  bangkok: "169",
  singapore: "170",
  bali: "347",
  "abu-dhabi": "494",
  "kuala-lumpur": "171",
};

export function gygLocationId(city: string): string | undefined {
  return GYG_LOCATION_IDS[city];
}

/**
 * A hand-picked hero tour per city for the high-intent AVAILABILITY widget.
 * Only set where we have a verified tour id — others get the city widget only.
 */
const GYG_FEATURED_TOUR: Record<string, string> = {
  dubai: "280242",
  "abu-dhabi": "162644",
  bangkok: "176568",
};

export function gygFeaturedTour(city: string): string | undefined {
  return GYG_FEATURED_TOUR[city];
}

/** 1–3 hand-picked heroes for the homepage ACTIVITY strip. */
export const GYG_CURATED_TOUR_IDS = "280242,162644,176568";
