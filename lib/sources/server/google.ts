import "./guard";
import type { Category } from "../../types";
import type { PlaceSource, RawReview, RawSourceDetails, RawSourcePlace } from "../types";
import { GOOGLE_PLACES_KEY, hasGoogle } from "./env";
import { getJson } from "./http";

/**
 * Google Places adapter (legacy Places API — the New Places API is preferred for
 * new keys; the mapping below is what changes if you migrate). Google is our
 * PRIMARY discovery source: it seeds the place list and carries the richest
 * details. Requires GOOGLE_PLACES_KEY; returns [] when unconfigured.
 */

const NEARBY = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const SEARCH_RADIUS_M = 1200;

const CATEGORY_TYPE: Record<Category, string> = {
  eat: "restaurant",
  drink: "bar",
  shop: "store",
  see: "tourist_attraction",
};

interface GNearby {
  results?: {
    place_id: string;
    name: string;
    geometry?: { location?: { lat: number; lng: number } };
    rating?: number;
    user_ratings_total?: number;
  }[];
}
interface GDetails {
  result?: {
    place_id: string;
    name: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    vicinity?: string;
    reviews?: {
      text: string;
      rating: number;
      time: number; // epoch seconds
      language?: string;
      author_url?: string;
    }[];
    photos?: { photo_reference: string; html_attributions?: string[] }[];
    opening_hours?: { weekday_text?: string[] };
  };
}

export const googleSource: PlaceSource = {
  name: "google",

  async searchNearby(category: Category, lat: number, lng: number): Promise<RawSourcePlace[]> {
    if (!hasGoogle()) return [];
    const url = `${NEARBY}?location=${lat},${lng}&radius=${SEARCH_RADIUS_M}&type=${CATEGORY_TYPE[category]}&key=${GOOGLE_PLACES_KEY}`;
    const data = await getJson<GNearby>(url);
    return (data?.results ?? [])
      .filter((r) => r.geometry?.location)
      .map((r) => ({
        sourceName: "google" as const,
        sourceId: r.place_id,
        name: r.name,
        lat: r.geometry!.location!.lat,
        lng: r.geometry!.location!.lng,
        category,
        rating: r.rating ?? 0,
        ratingScaleMax: 5 as const,
        reviewCount: r.user_ratings_total ?? 0,
      }));
  },

  async getDetails(placeId: string): Promise<RawSourceDetails> {
    const fields = "place_id,name,rating,user_ratings_total,price_level,vicinity,reviews,photos,opening_hours";
    const url = `${DETAILS}?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_KEY}`;
    const data = await getJson<GDetails>(url);
    const r = data?.result;
    const rating = r?.rating ?? 0;

    const reviews: RawReview[] = (r?.reviews ?? []).map((rv) => ({
      text: rv.text ?? "",
      rating: rv.rating,
      dateISO: new Date((rv.time ?? 0) * 1000).toISOString().slice(0, 10),
      language: rv.language ?? "und",
      authorId: rv.author_url,
      // NOTE: no local/tourist label — the classifier infers it at merge time.
    }));

    return {
      sourceName: "google",
      sourceId: placeId,
      name: r?.name ?? "",
      rating,
      ratingScaleMax: 5,
      ratingNormalized: rating, // already 0–5
      reviewCount: r?.user_ratings_total ?? 0,
      reviews,
      // Photo URLs point at OUR proxy (/api/photo) — the key never leaves the
      // server. Attribution comes from html_attributions (required by ToS).
      photos: (r?.photos ?? []).slice(0, 6).map((p) => ({
        url: `/api/photo?ref=${encodeURIComponent(p.photo_reference)}`,
        attribution: (p.html_attributions?.[0] ?? "Google Maps contributor").replace(/<[^>]+>/g, ""),
      })),
      priceLevel: r?.price_level ? (Math.min(4, Math.max(1, r.price_level)) as 1 | 2 | 3 | 4) : undefined,
      neighborhood: r?.vicinity,
      // Google's API does not expose popular_times → busyByHour derived elsewhere.
      // recentReviewCount90d / velocity are DERIVED at merge from review dates.
    };
  },
};
