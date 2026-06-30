import type { Experience, ExperienceAdapter } from "../types";

/**
 * Real provider adapters. Each maps that provider's raw API response into our
 * Experience type — the UI never sees these raw shapes. They are gated on a
 * server-side API key (env) and return [] until credentials are approved, so
 * the app stays buildable. The mapping functions show the exact shape to fill
 * in; only the fetch URL/auth + field names need confirming per provider docs.
 *
 * Near-fresh, not stale: fetches use `next.revalidate` so prices refresh
 * periodically, and we still render price as indicative "from ₹X".
 */

const REVALIDATE_SECONDS = 1800; // 30 min

/* ── Headout ───────────────────────────────────────────────────────────── */
interface HeadoutRaw {
  id: string | number;
  name: string;
  canonicalUrl: string;
  imageUrl: string;
  primaryCategory?: { name?: string };
  averageRating?: number;
  ratingsCount?: number;
  listingPrice?: { finalPrice?: number; currencyCode?: string };
  durationText?: string;
}
function mapHeadout(r: HeadoutRaw, city: string, country: string): Experience {
  return {
    id: `headout-${r.id}`,
    title: r.name,
    image: r.imageUrl,
    imageAlt: r.name,
    city,
    country,
    category: r.primaryCategory?.name ?? "Experience",
    rating: r.averageRating ?? 0,
    reviewCount: r.ratingsCount ?? 0,
    priceFrom: Math.round(r.listingPrice?.finalPrice ?? 0),
    currency: r.listingPrice?.currencyCode ?? "INR",
    duration: r.durationText ?? "",
    bookingUrl: r.canonicalUrl,
    provider: "headout",
  };
}

export const headoutAdapter: ExperienceAdapter = {
  provider: "headout",
  async list(city, opts) {
    const key = process.env.HEADOUT_API_KEY;
    if (!key) return [];
    const res = await fetch(
      `https://api.headout.com/api/public/v1/product/?city=${encodeURIComponent(city)}&limit=${opts?.limit ?? 8}`,
      { headers: { "Headout-Auth": key }, next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: HeadoutRaw[] };
    return (data.items ?? []).map((r) => mapHeadout(r, city, ""));
  },
};

/* ── Viator ────────────────────────────────────────────────────────────── */
interface ViatorRaw {
  productCode: string;
  title: string;
  images?: { variants?: { url?: string }[] }[];
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  pricing?: { summary?: { fromPrice?: number }; currency?: string };
  duration?: { description?: string };
  productUrl: string;
}
function mapViator(r: ViatorRaw, city: string, country: string): Experience {
  return {
    id: `viator-${r.productCode}`,
    title: r.title,
    image: r.images?.[0]?.variants?.at(-1)?.url ?? "",
    imageAlt: r.title,
    city,
    country,
    category: "Experience",
    rating: r.reviews?.combinedAverageRating ?? 0,
    reviewCount: r.reviews?.totalReviews ?? 0,
    priceFrom: Math.round(r.pricing?.summary?.fromPrice ?? 0),
    currency: r.pricing?.currency ?? "INR",
    duration: r.duration?.description ?? "",
    bookingUrl: r.productUrl,
    provider: "viator",
  };
}

export const viatorAdapter: ExperienceAdapter = {
  provider: "viator",
  async list(city, opts) {
    const key = process.env.VIATOR_API_KEY;
    if (!key) return [];
    const res = await fetch("https://api.viator.com/partner/products/search", {
      method: "POST",
      headers: { "exp-api-key": key, "Content-Type": "application/json", Accept: "application/json;version=2.0" },
      body: JSON.stringify({ filtering: { destination: city }, pagination: { count: opts?.limit ?? 8 } }),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: ViatorRaw[] };
    return (data.products ?? []).map((r) => mapViator(r, city, ""));
  },
};

/* ── GetYourGuide ──────────────────────────────────────────────────────── */
interface GygRaw {
  tour_id: string | number;
  title: string;
  photos?: { url?: string }[];
  categories?: string[];
  overall_rating?: number;
  number_of_ratings?: number;
  price?: { values?: { amount?: number }; currency?: string };
  duration?: string;
  url: string;
}
function mapGyg(r: GygRaw, city: string, country: string): Experience {
  return {
    id: `gyg-${r.tour_id}`,
    title: r.title,
    image: r.photos?.[0]?.url ?? "",
    imageAlt: r.title,
    city,
    country,
    category: r.categories?.[0] ?? "Experience",
    rating: r.overall_rating ?? 0,
    reviewCount: r.number_of_ratings ?? 0,
    priceFrom: Math.round(r.price?.values?.amount ?? 0),
    currency: r.price?.currency ?? "INR",
    duration: r.duration ?? "",
    bookingUrl: r.url,
    provider: "getyourguide",
  };
}

export const getyourguideAdapter: ExperienceAdapter = {
  provider: "getyourguide",
  async list(city, opts) {
    const key = process.env.GETYOURGUIDE_API_KEY;
    if (!key) return [];
    const res = await fetch(
      `https://api.getyourguide.com/1/tours?q=${encodeURIComponent(city)}&cnt=${opts?.limit ?? 8}`,
      { headers: { "X-ACCESS-TOKEN": key }, next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: { tours?: GygRaw[] } };
    return (data.data?.tours ?? []).map((r) => mapGyg(r, city, ""));
  },
};
