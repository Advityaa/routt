import type { Category, TimeOfDay } from "./types";

/**
 * Pure time-of-day logic that drives the home screen's "it knows my situation"
 * feel: the situational prompt and the default category both derive from the
 * current local hour. Kept separate + pure so it's trivial to reason about.
 */

/** Map a 0–23 hour to a coarse part of day. */
export function getTimeOfDay(hour: number): TimeOfDay {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  if (h >= 5 && h <= 10) return "morning";
  if (h >= 11 && h <= 14) return "lunch";
  if (h >= 15 && h <= 17) return "afternoon";
  if (h >= 18 && h <= 21) return "evening";
  return "night"; // 22–4
}

/** The one-line situational prompt shown as the screen's headline. */
export function getSituationPrompt(tod: TimeOfDay): string {
  switch (tod) {
    case "morning":
      return "Good morning. Coffee and breakfast locals rate.";
    case "lunch":
      return "Time to eat. Here's where locals actually go.";
    case "afternoon":
      return "Markets, shops and sights worth your time right now.";
    case "evening":
      return "Dinner and what's on tonight.";
    case "night":
      return "Metro's winding down. Late spots and how to get back.";
  }
}

/** The category pre-selected for this part of the day (user can override). */
export function getDefaultCategory(tod: TimeOfDay): Category {
  switch (tod) {
    case "morning":
    case "lunch":
      return "eat";
    case "afternoon":
      return "shop";
    case "evening":
    case "night":
      return "drink";
  }
}
