import type { PlaceSource } from "./types";
import { USE_MOCK } from "./config";
import { mockSearchNearby, mockGetDetails } from "./mockData";

/**
 * Google Places adapter. Real mode (later): Nearby Search + Place Details,
 * rating on 0–5, reviews[], price_level, popular_times. v1 returns mock.
 */
export const googleSource: PlaceSource = {
  name: "google",
  async searchNearby(category) {
    if (USE_MOCK) return mockSearchNearby("google", category);
    throw new Error("[google] real Places API not wired yet — set USE_MOCK=true");
  },
  async getDetails(sourcePlaceId) {
    if (USE_MOCK) return mockGetDetails("google", sourcePlaceId);
    throw new Error("[google] real Places API not wired yet — set USE_MOCK=true");
  },
};
