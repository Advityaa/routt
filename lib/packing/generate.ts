import { ACTIVITIES, DESTINATION_PACKING } from "./data";
import type { PackingItem, PackingResult, WeatherSummary } from "./types";

/**
 * Pure, transparent packing generator. Turns a weather summary + trip length +
 * picked activities + destination notes into grouped items, each with a plain
 * reason. No network/fs — fully testable, and it's what makes the list feel
 * intelligent rather than a generic template (hot August ≠ cool January).
 */

const slug = (s: string) =>
  s.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");

function dedupe(items: PackingItem[]): PackingItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.label.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const ESSENTIALS: string[] = [
  "Passport",
  "Visa & printed bookings",
  "Phone + charger",
  "Universal travel adapter",
  "Power bank",
  "Any personal medication",
  "Forex card / some cash",
  "eSIM or local SIM",
];

export function generatePacking(input: {
  summary: WeatherSummary | null;
  tripDays: number;
  activities: string[];
  destination: string;
  cityName: string;
}): PackingResult {
  const { summary, tripDays, activities, destination, cityName } = input;
  const weather: PackingItem[] = [];
  const add = (label: string, reason: string) => weather.push({ id: slug(label), label, reason });

  if (summary) {
    const verb = summary.mode === "forecast" ? "is forecast around" : "averages around";
    const tempReason = `Because ${cityName} ${verb} ${summary.avgHigh}°C/${summary.avgLow}°C in ${summary.monthLabel}`;

    switch (summary.band) {
      case "hot":
        add("Light, breathable clothing", `${tempReason} — hot`);
        add("Sunglasses", tempReason);
        add("Sun hat or cap", tempReason);
        add("Refillable water bottle", `Stay hydrated — highs near ${summary.avgHigh}°C`);
        break;
      case "warm":
        add("Light clothing", tempReason);
        add("Sunglasses", tempReason);
        break;
      case "mild":
        add("Light layers or a sweater", `${tempReason} — mild`);
        break;
      case "cool":
        add("Warm layers", `${tempReason} — cool`);
        add("A jacket", tempReason);
        break;
      case "cold":
        add("A heavy coat", `${tempReason} — cold`);
        add("Gloves & a beanie", `Lows near ${summary.avgLow}°C`);
        break;
    }

    if ((summary.maxUv && summary.maxUv >= 8) || summary.band === "hot" || summary.band === "warm") {
      add(
        "High-SPF sunscreen (SPF 50)",
        summary.maxUv ? `UV index reaches ~${summary.maxUv} during your dates` : `Strong sun in ${cityName}`
      );
    }

    if (summary.rain === "likely") {
      add("Compact umbrella", "Rain is likely during your dates");
      add("A light rain jacket", "Rain is likely during your dates");
      add("Water-resistant shoes", "Rain is likely during your dates");
    } else if (summary.rain === "some") {
      add("Compact umbrella", "Some rain is possible during your dates");
    }

    if (summary.windy) add("A windbreaker", "Breezy conditions expected");

    add(`Outfits for ~${tripDays} day${tripDays === 1 ? "" : "s"}`, `Based on your ${tripDays}-day trip`);
  }

  // Destination-aware essentials (context weather can't infer).
  for (const note of DESTINATION_PACKING[destination] ?? []) {
    weather.push({ id: slug(note.label), label: note.label, reason: note.reason });
  }

  // Activity-driven items.
  const activity: PackingItem[] = [];
  for (const def of ACTIVITIES) {
    if (!activities.includes(def.key)) continue;
    for (const it of def.items) {
      activity.push({ id: slug(`${def.key}-${it}`), label: it, reason: `Because you picked ${def.label}` });
    }
  }

  const essentials: PackingItem[] = ESSENTIALS.map((label) => ({ id: slug(label), label }));

  return { weather: dedupe(weather), activity: dedupe(activity), essentials };
}
