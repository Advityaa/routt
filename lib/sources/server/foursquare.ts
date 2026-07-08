import "./guard";
import type { Category } from "../../types";
import type { PlaceSource, RawReview, RawSourceDetails, RawSourcePlace } from "../types";
import { FOURSQUARE_KEY, hasFoursquare } from "./env";
import { getJson } from "./http";

/**
 * Foursquare Places adapter (v3). A CROSS-SOURCE corroboration signal: its rating
 * (0–10) and tips give an independent read on the same place. Requires
 * FOURSQUARE_KEY; returns [] when unconfigured.
 */

const SEARCH = "https://api.foursquare.com/v3/places/search";
const SEARCH_RADIUS_M = 1200;

// Coarse FSQ v3 category ids (fine for v1; refine later).
const CATEGORY_IDS: Record<Category, string> = {
  eat: "13065", // Restaurant
  drink: "13003", // Bar
  shop: "17000", // Retail
  see: "16000", // Landmarks & Outdoors
};

const authHeader = () => ({ Authorization: FOURSQUARE_KEY, Accept: "application/json" });

interface FSearch {
  results?: {
    fsq_id: string;
    name: string;
    geocodes?: { main?: { latitude: number; longitude: number } };
    rating?: number; // 0–10
    stats?: { total_ratings?: number };
    price?: number; // 1–4
  }[];
}
interface FTip {
  text?: string;
  created_at?: string;
}

export const foursquareSource: PlaceSource = {
  name: "foursquare",

  async searchNearby(category: Category, lat: number, lng: number): Promise<RawSourcePlace[]> {
    if (!hasFoursquare()) return [];
    const url = `${SEARCH}?ll=${lat},${lng}&radius=${SEARCH_RADIUS_M}&categories=${CATEGORY_IDS[category]}&fields=fsq_id,name,geocodes,rating,stats,price&limit=20`;
    const data = await getJson<FSearch>(url, { headers: authHeader() });
    return (data?.results ?? [])
      .filter((r) => r.geocodes?.main && typeof r.rating === "number")
      .map((r) => ({
        sourceName: "foursquare" as const,
        sourceId: r.fsq_id,
        name: r.name,
        lat: r.geocodes!.main!.latitude,
        lng: r.geocodes!.main!.longitude,
        category,
        rating: r.rating ?? 0,
        ratingScaleMax: 10 as const,
        reviewCount: r.stats?.total_ratings ?? 0,
      }));
  },

  async getDetails(fsqId: string): Promise<RawSourceDetails> {
    const detailUrl = `https://api.foursquare.com/v3/places/${fsqId}?fields=fsq_id,name,rating,stats,price`;
    const tipsUrl = `https://api.foursquare.com/v3/places/${fsqId}/tips?limit=10&fields=text,created_at`;
    const photosUrl = `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=4`;
    const [detail, tips, fsqPhotos] = await Promise.all([
      getJson<{ name?: string; rating?: number; stats?: { total_ratings?: number }; price?: number }>(
        detailUrl,
        { headers: authHeader() },
      ),
      getJson<FTip[]>(tipsUrl, { headers: authHeader() }),
      getJson<{ prefix?: string; suffix?: string }[]>(photosUrl, { headers: authHeader() }),
    ]);

    const rating = detail?.rating ?? 0; // 0–10
    // Tips have no per-tip rating; treated as light text signals only (the tip's
    // "rating" mirrors the place rating so it doesn't skew the corpus).
    const reviews: RawReview[] = (tips ?? []).map((t) => ({
      text: t.text ?? "",
      rating,
      dateISO: (t.created_at ?? new Date().toISOString()).slice(0, 10),
      language: "und",
      // no local/tourist label → classifier infers at merge time.
    }));

    return {
      sourceName: "foursquare",
      sourceId: fsqId,
      name: detail?.name ?? "",
      rating,
      ratingScaleMax: 10,
      ratingNormalized: (rating / 10) * 5,
      reviewCount: detail?.stats?.total_ratings ?? 0,
      reviews,
      // FSQ photo URLs are public CDN links (prefix+size+suffix) — no key inside.
      photos: (fsqPhotos ?? [])
        .filter((p) => p.prefix && p.suffix)
        .map((p) => ({ url: `${p.prefix}800x600${p.suffix}`, attribution: "Foursquare user photo" })),
      priceLevel: detail?.price ? (Math.min(4, Math.max(1, detail.price)) as 1 | 2 | 3 | 4) : undefined,
    };
  },
};
