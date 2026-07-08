import type { PlaceSource } from "./types";
import { USE_MOCK } from "./config";
import { mockSearchNearby, mockGetDetails } from "./mockData";

/**
 * Reddit adapter. Real mode (later): search subreddits/threads for a place,
 * derive a 0–1 sentiment score and pull comment excerpts as "reviews" (a strong
 * local-vs-tourist signal). v1 returns mock (sentiment on its 0–1 scale).
 */
export const redditSource: PlaceSource = {
  name: "reddit",
  async searchNearby(category) {
    if (USE_MOCK) return mockSearchNearby("reddit", category);
    throw new Error("[reddit] real API not wired yet — set USE_MOCK=true");
  },
  async getDetails(sourcePlaceId) {
    if (USE_MOCK) return mockGetDetails("reddit", sourcePlaceId);
    throw new Error("[reddit] real API not wired yet — set USE_MOCK=true");
  },
};
