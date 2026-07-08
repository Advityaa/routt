/** Smart packing generator — pure. Items from weather thresholds + trip length
 *  + activities, each with an honest REASON. Groups: Weather/Activity/Essentials. */
export interface TripWeather { mode: "forecast" | "typical"; avgHighC: number; avgLowC: number; rainDays: number }
export interface PackItem { id: string; label: string; reason: string; group: "Weather" | "Activity" | "Essentials" }
export const ACTIVITIES = ["beach", "desert safari", "hiking", "nightlife", "business"] as const;
export function generatePacking(dest: string, nights: number, w: TripWeather | null, acts: string[]): PackItem[] {
  const items: PackItem[] = [];
  const label = w?.mode === "forecast" ? "forecast" : "typically";
  if (w) {
    if (w.avgHighC >= 33) items.push({ id: "heat", label: "Light, breathable clothing + sun hat", reason: `because ${dest} ${label} averages ${w.avgHighC}°C highs on your dates`, group: "Weather" });
    if (w.avgHighC >= 28) items.push({ id: "sunscreen", label: "High-SPF sunscreen", reason: `${w.avgHighC}°C ${label} — strong sun`, group: "Weather" });
    if (w.avgLowC <= 12) items.push({ id: "layer", label: "Warm layer / jacket", reason: `nights ${label} drop to ${w.avgLowC}°C`, group: "Weather" });
    if (w.rainDays >= 2) items.push({ id: "rain", label: "Packable rain jacket / umbrella", reason: `rain on ~${w.rainDays} of your days (${label})`, group: "Weather" });
  }
  if (acts.includes("beach")) items.push({ id: "swim", label: "Swimwear + flip-flops", reason: "because you picked beach", group: "Activity" });
  if (acts.includes("desert safari")) items.push({ id: "desert", label: "Scarf/shemagh + closed shoes", reason: "because you picked a desert safari", group: "Activity" });
  if (acts.includes("hiking")) items.push({ id: "hike", label: "Trail shoes + refillable bottle", reason: "because you picked hiking", group: "Activity" });
  if (acts.includes("nightlife")) items.push({ id: "night", label: "One smart-casual outfit", reason: "because you picked nightlife", group: "Activity" });
  if (acts.includes("business")) items.push({ id: "biz", label: "Business attire + adapters", reason: "because you picked business", group: "Activity" });
  items.push({ id: "docs", label: "Passport + copies", reason: "essential for any trip", group: "Essentials" });
  items.push({ id: "meds", label: "Medications + basic first aid", reason: "essential for any trip", group: "Essentials" });
  items.push({ id: "socks", label: `~${Math.max(3, Math.min(10, nights + 1))} sets of underwear/socks`, reason: `${nights} night${nights === 1 ? "" : "s"} away`, group: "Essentials" });
  if (nights >= 7) items.push({ id: "laundry", label: "Small laundry kit", reason: `${nights} nights — you'll wash mid-trip`, group: "Essentials" });
  return items;
}
