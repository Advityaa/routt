import "server-only";
import type { RainLevel, WeatherBand, WeatherSummary } from "./types";

/**
 * Open-Meteo weather (free, no API key). Two modes by how far away the trip is:
 *   - within ~14 days  → FORECAST API (real daily forecast)
 *   - further out      → HISTORICAL archive for the same calendar dates last
 *                        year → "typical conditions for this time of year"
 * That's what makes Dubai-in-August differ from Dubai-in-January for trips
 * booked months ahead.
 *
 * Called server-side only and cached (fetch revalidate) so we don't hammer the
 * API. NOTE: Open-Meteo's free tier is for non-commercial use — commercial
 * volume may require their paid plan. Verify current terms before scaling.
 */

const FORECAST_HORIZON_DAYS = 14;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseISO(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, "0")}-${`${d.getUTCDate()}`.padStart(2, "0")}`;
}
function daysFromToday(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseISO(iso).getTime() - today) / 86_400_000);
}
/**
 * The same calendar window in the most recent PAST year that the archive
 * actually has data for. The archive only covers up to ~today, so we can't use
 * "trip year − 1" (e.g. an Aug-2027 trip would map to Aug-2026, still in the
 * future). We pick the latest year whose start date is safely before the
 * archive cutoff, then span the trip length from there.
 */
function typicalRange(startISO: string, spanDays: number): { start: string; end: string } {
  const s = parseISO(startISO);
  const sm = s.getUTCMonth();
  const sd = s.getUTCDate();
  const now = new Date();
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 7 * 86_400_000;
  let year = now.getUTCFullYear();
  if (Date.UTC(year, sm, sd) > cutoff) year -= 1;
  const start = new Date(Date.UTC(year, sm, sd));
  const end = new Date(Date.UTC(year, sm, sd + spanDays));
  return { start: toISO(start), end: toISO(end) };
}
function mean(xs: (number | null)[]): number {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
function max(xs: (number | null)[]): number {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? Math.max(...v) : 0;
}

function bandFor(avgHigh: number): WeatherBand {
  if (avgHigh > 32) return "hot";
  if (avgHigh >= 24) return "warm";
  if (avgHigh >= 16) return "mild";
  if (avgHigh >= 8) return "cool";
  return "cold";
}

function bandWord(band: WeatherBand): string {
  return { hot: "hot", warm: "warm", mild: "mild", cool: "cool", cold: "cold" }[band];
}

function rainWord(rain: RainLevel): string {
  return rain === "none" ? "no rain expected" : rain === "some" ? "some rain possible" : "rain likely";
}

interface DailyResp {
  daily?: {
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
    uv_index_max?: (number | null)[];
  };
}

export async function getWeather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<WeatherSummary | null> {
  const startDays = daysFromToday(startDate);
  const useForecast = startDays <= FORECAST_HORIZON_DAYS && daysFromToday(endDate) >= -1;
  const monthLabel = MONTHS[parseISO(startDate).getUTCMonth()];
  const days = Math.max(1, Math.round((parseISO(endDate).getTime() - parseISO(startDate).getTime()) / 86_400_000) + 1);

  let url: string;
  let mode: "forecast" | "typical";

  if (useForecast) {
    mode = "forecast";
    // Clamp to the forecast horizon.
    const now = new Date();
    const todayISO = toISO(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
    const horizon = new Date();
    horizon.setUTCDate(horizon.getUTCDate() + 16);
    const s = startDays < 0 ? todayISO : startDate;
    const e = daysFromToday(endDate) > 16 ? toISO(horizon) : endDate;
    url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max` +
      `&timezone=auto&start_date=${s}&end_date=${e}`;
  } else {
    mode = "typical";
    // Same calendar window in the most recent past year the archive has.
    const { start: tStart, end: tEnd } = typicalRange(startDate, days - 1);
    url =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
      `&timezone=auto&start_date=${tStart}&end_date=${tEnd}`;
  }

  let data: DailyResp;
  try {
    const res = await fetch(url, {
      next: { revalidate: mode === "forecast" ? 10_800 : 604_800 }, // 3h vs 1 week
    });
    if (!res.ok) return null;
    data = (await res.json()) as DailyResp;
  } catch {
    return null;
  }

  const d = data.daily;
  if (!d || !d.temperature_2m_max?.length) return null;

  const avgHigh = Math.round(mean(d.temperature_2m_max));
  const avgLow = Math.round(mean(d.temperature_2m_min ?? []));
  const band = bandFor(avgHigh);

  let rain: RainLevel = "none";
  if (mode === "forecast") {
    const prob = max(d.precipitation_probability_max ?? []);
    if (prob >= 50) rain = "likely";
    else if (prob >= 20) rain = "some";
  } else {
    const avgPrecip = mean(d.precipitation_sum ?? []);
    if (avgPrecip >= 5) rain = "likely";
    else if (avgPrecip >= 1.5) rain = "some";
  }

  const maxUv = d.uv_index_max?.length ? Math.round(max(d.uv_index_max)) : undefined;
  const windy = max(d.wind_speed_10m_max ?? []) > 35;

  const summaryText = `${bandWord(band)} & ${rain === "none" ? "dry" : "wet"}, avg ${avgHigh}°C/${avgLow}°C, ${rainWord(rain)}`;

  return {
    mode,
    startDate,
    endDate,
    days,
    avgHigh,
    avgLow,
    band,
    rain,
    maxUv,
    windy,
    monthLabel,
    summaryText,
  };
}
