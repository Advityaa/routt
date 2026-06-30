/**
 * Provider-agnostic experiences layer.
 *
 * The UI consumes ONLY the normalized `Experience` type below. Each booking
 * provider (Headout, Viator, GetYourGuide, …) gets an adapter that maps its
 * raw API/widget response into this shape, so we can switch or mix providers
 * without touching any UI. Swapping mock → a real provider is a config +
 * adapter change, nothing else.
 */

export type ExperienceProvider =
  | "mock"
  | "headout"
  | "viator"
  | "getyourguide"
  | "klook";

export type ExperiencesMode = "api" | "widget";

export interface Experience {
  id: string;
  title: string;
  image: string;
  imageAlt: string;
  /** Destination slug, e.g. "dubai". */
  city: string;
  country: string;
  category: string;
  rating: number;
  reviewCount: number;
  /**
   * Indicative "from" price — NEVER presented as a guaranteed total. The real,
   * current price is confirmed on the provider's booking page.
   */
  priceFrom: number;
  currency: string;
  /** Human duration, e.g. "3 hours". */
  duration: string;
  /** Outbound booking URL (tracking params applied server-side before render). */
  bookingUrl: string;
  provider: ExperienceProvider;
}

/** Every provider implements this. The UI never sees raw provider data. */
export interface ExperienceAdapter {
  provider: ExperienceProvider;
  /** Fetch + normalize experiences for a destination slug. */
  list(city: string, opts?: { limit?: number }): Promise<Experience[]>;
}
