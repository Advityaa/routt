/** Client-safe packing types (no fetch/fs) so the generator + UI can import them. */

export type WeatherMode = "forecast" | "typical";
export type WeatherBand = "hot" | "warm" | "mild" | "cool" | "cold";
export type RainLevel = "none" | "some" | "likely";

export interface WeatherSummary {
  mode: WeatherMode;
  startDate: string; // YYYY-MM-DD (queried range)
  endDate: string;
  days: number;
  avgHigh: number;
  avgLow: number;
  band: WeatherBand;
  rain: RainLevel;
  maxUv?: number;
  windy: boolean;
  monthLabel: string; // e.g. "August"
  /** "hot & dry, avg 41°C/30°C, no rain expected" */
  summaryText: string;
}

export interface PackingItem {
  id: string;
  label: string;
  reason?: string;
}

export interface PackingResult {
  weather: PackingItem[];
  activity: PackingItem[];
  essentials: PackingItem[];
}
