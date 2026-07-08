/** Haggle helper — maintained local reference ranges (Bangkok v1). Range-based
 *  and honest: verdicts are guidance, not guarantees; ranges drift with fuel
 *  prices/seasons and should be re-checked periodically. */
export interface RefRange { key: string; label: string; fairLow: number; fairHigh: number; unit: string }
export const BKK_RANGES: RefRange[] = [
  { key: "taxi-airport", label: "Taxi: airport → city", fairLow: 300, fairHigh: 500, unit: "฿" },
  { key: "taxi-short", label: "Taxi: short hop (<5km)", fairLow: 60, fairHigh: 120, unit: "฿" },
  { key: "tuktuk", label: "Tuk-tuk: short ride", fairLow: 60, fairHigh: 150, unit: "฿" },
  { key: "street-meal", label: "Street-food meal", fairLow: 40, fairHigh: 90, unit: "฿" },
  { key: "beer", label: "Beer at a bar", fairLow: 80, fairHigh: 180, unit: "฿" },
  { key: "tshirt", label: "Market t-shirt", fairLow: 100, fairHigh: 250, unit: "฿" },
];
export type HaggleVerdict = "fair" | "overpriced" | "scam";
export function judgePrice(r: RefRange, quoted: number): { verdict: HaggleVerdict; note: string } {
  if (quoted <= r.fairHigh) return { verdict: "fair", note: `Locals pay ${r.unit}${r.fairLow}–${r.fairHigh}. That's in range.` };
  if (quoted <= r.fairHigh * 2) return { verdict: "overpriced", note: `Above the ${r.unit}${r.fairLow}–${r.fairHigh} local range — counter around ${r.unit}${r.fairHigh}.` };
  return { verdict: "scam", note: `${Math.round(quoted / r.fairHigh)}× the local ceiling of ${r.unit}${r.fairHigh}. Walk away.` };
}
