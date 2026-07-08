import type { TimeOfDay2, TripPhase } from "./RouttContext";

/**
 * Priority function — THE single place that decides what the home surface
 * leads with, from tripPhase + timeOfDay. Screens map keys → sections and
 * render in this order; nothing is hidden, only reordered/emphasised.
 * Section keys: "feed" (near-you-now), "trip" (countdown/prep/checklist →
 * /trip + /arrival), "events" (on this week), "rate" (post-trip stamps/rating).
 */
export interface HomePriority {
  order: ("feed" | "trip" | "events" | "rate")[];
  tone: string; // contextual line above the lead section
  feedEmphasis: "discover" | "eat-drink" | "see-do";
}

export function homePriority(phase: TripPhase, tod: TimeOfDay2): HomePriority {
  const evening = tod === "dusk" || tod === "night";
  switch (phase) {
    case "planning":
      return { order: ["trip", "feed", "events"], tone: "Trip taking shape — here's your prep.", feedEmphasis: "discover" };
    case "preflight":
      return { order: ["trip", "feed", "events"], tone: "Nearly time — final checks first.", feedEmphasis: "discover" };
    case "onground":
      return evening
        ? { order: ["feed", "events", "trip"], tone: "Evening's on — where to eat & drink now.", feedEmphasis: "eat-drink" }
        : { order: ["feed", "events", "trip"], tone: "You're here — worth your time right now.", feedEmphasis: "see-do" };
    case "post":
      return { order: ["rate", "feed", "events"], tone: "Back home — stamp the places you visited.", feedEmphasis: "discover" };
    case "dreaming":
    default:
      return { order: ["feed", "events", "trip"], tone: "No trip yet — see what's out there.", feedEmphasis: "discover" };
  }
}
