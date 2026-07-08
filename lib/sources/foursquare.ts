import type { PlaceSource } from "./types";
import { USE_MOCK } from "./config";
import { mockSearchNearby, mockGetDetails } from "./mockData";

/**
 * Foursquare Places adapter. Real mode (later): Place Search + Details, rating
 * on 0–10, tips[], price, categories. v1 returns mock (rating on its 0–10 scale).
 */
export const foursquareSource: PlaceSource = {
  name: "foursquare",
  async searchNearby(category) {
    if (USE_MOCK) return mockSearchNearby("foursquare", category);
    throw new Error("[foursquare] real Places API not wired yet — set USE_MOCK=true");
  },
  async getDetails(sourcePlaceId) {
    if (USE_MOCK) return mockGetDetails("foursquare", sourcePlaceId);
    throw new Error("[foursquare] real Places API not wired yet — set USE_MOCK=true");
  },
};
