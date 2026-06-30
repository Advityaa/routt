import { getTheme } from "@/lib/theme";
import type { Experience, ExperienceAdapter } from "../types";

/**
 * Mock adapter — realistic placeholder data matching the Experience interface,
 * so the whole UI is buildable + testable before real credentials land.
 * Dropping in a real provider = swap the adapter, no UI change.
 *
 * Images: a small shared activity pool + each city's own hero photo. Real
 * adapters supply their own per-activity imagery.
 */

const A = {
  food: "https://images.unsplash.com/photo-1760546100206-de205df95289?auto=format&fit=crop&w=1200&q=70",
  air: "https://images.unsplash.com/photo-1758558364489-e6b0a03d1fcf?auto=format&fit=crop&w=1200&q=70",
  water: "https://images.unsplash.com/photo-1756989820112-15eec2697cb7?auto=format&fit=crop&w=1200&q=70",
};

const COUNTRY: Record<string, string> = {
  dubai: "United Arab Emirates",
  bangkok: "Thailand",
  singapore: "Singapore",
  bali: "Indonesia",
  "abu-dhabi": "United Arab Emirates",
  "kuala-lumpur": "Malaysia",
};

interface Seed {
  title: string;
  category: string;
  priceFrom: number;
  duration: string;
  rating: number;
  reviewCount: number;
  img: "city" | "food" | "air" | "water";
}

const SEEDS: Record<string, Seed[]> = {
  dubai: [
    { title: "Burj Khalifa: At the Top (Levels 124 & 125)", category: "Sightseeing", priceFrom: 2800, duration: "1–2 hours", rating: 4.7, reviewCount: 38210, img: "city" },
    { title: "Red Dunes Desert Safari with BBQ Dinner", category: "Adventure", priceFrom: 2200, duration: "6 hours", rating: 4.8, reviewCount: 51234, img: "city" },
    { title: "Dubai Marina Luxury Dinner Cruise", category: "Cruise", priceFrom: 3100, duration: "2 hours", rating: 4.6, reviewCount: 12044, img: "water" },
    { title: "Old Dubai & Souks Street-Food Tour", category: "Food", priceFrom: 2500, duration: "3 hours", rating: 4.9, reviewCount: 5021, img: "food" },
  ],
  bangkok: [
    { title: "Grand Palace & Wat Pho Guided Tour", category: "Sightseeing", priceFrom: 1500, duration: "4 hours", rating: 4.7, reviewCount: 22890, img: "city" },
    { title: "Damnoen Saduak Floating Markets Day Trip", category: "Day trip", priceFrom: 1800, duration: "6 hours", rating: 4.6, reviewCount: 18430, img: "water" },
    { title: "Bangkok Street-Food Night Tour by Tuk-Tuk", category: "Food", priceFrom: 1600, duration: "3.5 hours", rating: 4.9, reviewCount: 9120, img: "food" },
    { title: "Chao Phraya River Dinner Cruise", category: "Cruise", priceFrom: 2000, duration: "2 hours", rating: 4.5, reviewCount: 14002, img: "water" },
  ],
  singapore: [
    { title: "Gardens by the Bay + Cloud Forest", category: "Sightseeing", priceFrom: 1900, duration: "Half day", rating: 4.8, reviewCount: 41200, img: "city" },
    { title: "Universal Studios Singapore Ticket", category: "Theme park", priceFrom: 4800, duration: "Full day", rating: 4.7, reviewCount: 33550, img: "city" },
    { title: "Singapore River Evening Cruise", category: "Cruise", priceFrom: 1300, duration: "40 mins", rating: 4.5, reviewCount: 8740, img: "water" },
    { title: "Hawker Centre Food Walking Tour", category: "Food", priceFrom: 2600, duration: "3 hours", rating: 4.9, reviewCount: 3980, img: "food" },
  ],
  bali: [
    { title: "Ubud Rice Terraces & Temples Tour", category: "Sightseeing", priceFrom: 1400, duration: "Full day", rating: 4.8, reviewCount: 27640, img: "city" },
    { title: "Mount Batur Sunrise Trek", category: "Adventure", priceFrom: 2100, duration: "8 hours", rating: 4.9, reviewCount: 19880, img: "air" },
    { title: "Nusa Penida Island Day Trip", category: "Day trip", priceFrom: 2700, duration: "Full day", rating: 4.6, reviewCount: 22310, img: "water" },
    { title: "Balinese Cooking Class with Market Visit", category: "Food", priceFrom: 1800, duration: "4 hours", rating: 4.9, reviewCount: 6450, img: "food" },
  ],
  "abu-dhabi": [
    { title: "Sheikh Zayed Grand Mosque Guided Tour", category: "Sightseeing", priceFrom: 1700, duration: "3 hours", rating: 4.8, reviewCount: 15220, img: "city" },
    { title: "Ferrari World Abu Dhabi Ticket", category: "Theme park", priceFrom: 5200, duration: "Full day", rating: 4.7, reviewCount: 21010, img: "city" },
    { title: "Evening Desert Safari with Dinner", category: "Adventure", priceFrom: 2300, duration: "6 hours", rating: 4.7, reviewCount: 9870, img: "city" },
    { title: "Yas Marina Sunset Dinner Cruise", category: "Cruise", priceFrom: 3000, duration: "2 hours", rating: 4.5, reviewCount: 3120, img: "water" },
  ],
  "kuala-lumpur": [
    { title: "Petronas Towers Skybridge & Observation Deck", category: "Sightseeing", priceFrom: 1600, duration: "1–2 hours", rating: 4.7, reviewCount: 17640, img: "city" },
    { title: "Batu Caves & City Highlights Tour", category: "Sightseeing", priceFrom: 1500, duration: "5 hours", rating: 4.6, reviewCount: 11250, img: "city" },
    { title: "KL Street-Food Night Tour", category: "Food", priceFrom: 1700, duration: "3.5 hours", rating: 4.9, reviewCount: 4310, img: "food" },
    { title: "Sunrise Hot-Air Balloon over the Highlands", category: "Adventure", priceFrom: 6500, duration: "4 hours", rating: 4.8, reviewCount: 2210, img: "air" },
  ],
};

function imageFor(city: string, kind: Seed["img"]): string {
  if (kind === "city") return getTheme(city).heroImage;
  return A[kind];
}

export const mockAdapter: ExperienceAdapter = {
  provider: "mock",
  async list(city, opts) {
    const seeds = SEEDS[city] ?? [];
    const limit = opts?.limit ?? seeds.length;
    return seeds.slice(0, limit).map((s, i) => ({
      id: `${city}-${i + 1}`,
      title: s.title,
      image: imageFor(city, s.img),
      imageAlt: `${s.title} — ${city}`,
      city,
      country: COUNTRY[city] ?? "",
      category: s.category,
      rating: s.rating,
      reviewCount: s.reviewCount,
      priceFrom: s.priceFrom,
      currency: "INR",
      duration: s.duration,
      // Plausible provider URL; tracking params are applied server-side later.
      bookingUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(s.title)}`,
      provider: "mock",
    }));
  },
};

/** Cities that have mock experiences (used by the curated homepage strip). */
export const MOCK_CITIES = Object.keys(SEEDS);
