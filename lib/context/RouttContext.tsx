"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAreaLabel } from "@/lib/dataProvider";
import { getSaved } from "@/lib/savedTrip";
import { getTrip } from "@/lib/trip";

/**
 * RouttContext — the app-wide "context engine": senses the traveler's situation
 * (time of day, location, weather, trip phase) so any feature can adapt.
 *
 * Privacy/perf rules: geolocation is opt-in (browser prompt) with a Bangkok
 * fallback + manual override — the app NEVER blocks on it, and coordinates are
 * never stored server-side (weather calls use ~1km-rounded coords, uncached
 * per-user). Weather is fetched async via our cached /api/weather; offline or
 * denied → fields stay null and the UI degrades gracefully.
 */

export type TimeOfDay2 = "dawn" | "day" | "dusk" | "night";
export type TripPhase = "dreaming" | "planning" | "preflight" | "onground" | "post";

export interface RouttSituation {
  timeOfDay: TimeOfDay2;
  hour: number;
  location: { lat: number; lng: number; city: string; source: "gps" | "fallback" | "manual" };
  weather: { tempC: number; condition: string } | null; // null until loaded / if unavailable
  tripPhase: TripPhase;
  requestLocation: () => void;
  setManualLocation: (lat: number, lng: number) => void;
}

const BANGKOK = { lat: 13.7376, lng: 100.5602 };

function timeOfDayFrom(h: number): TimeOfDay2 {
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

/**
 * v1 trip-phase heuristic (trips carry no dates yet — documented, not fabricated):
 * nothing saved → dreaming; saved places → planning; hotel address saved (the
 * arrival ritual) → preflight. onground/post activate once trips gain dates.
 */
function derivePhase(): TripPhase {
  try {
    const trip = getTrip();
    if (trip?.startISO) {
      const DAY = 86_400_000;
      const start = Date.parse(trip.startISO);
      const end = trip.endISO ? Date.parse(trip.endISO) + DAY : start + 7 * DAY;
      const now = Date.now();
      if (now >= end) return "post";
      if (now >= start) return "onground";
      if (start - now <= 2 * DAY) return "preflight"; // within ~48h
      return "planning";
    }
    if (localStorage.getItem("routt.hotelAddress")) return "preflight";
    return getSaved().length > 0 ? "planning" : "dreaming";
  } catch {
    return "dreaming";
  }
}

const Ctx = createContext<RouttSituation | null>(null);

export function RouttProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [coords, setCoords] = useState<{ lat: number; lng: number; source: "gps" | "fallback" | "manual" }>({ ...BANGKOK, source: "fallback" });
  const [city, setCity] = useState("Bangkok");
  const [weather, setWeather] = useState<RouttSituation["weather"]>(null);
  const [tripPhase, setTripPhase] = useState<TripPhase>("dreaming");

  useEffect(() => {
    setTripPhase(derivePhase());
    const t = setInterval(() => setNow(new Date()), 60_000);
    requestLocation();
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestLocation() {
    if (!navigator?.geolocation) return; // stay on fallback
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, source: "gps" }),
      () => {}, // denied → fallback, never block
      { timeout: 8000, maximumAge: 300_000 },
    );
  }
  const setManualLocation = (lat: number, lng: number) => setCoords({ lat, lng, source: "manual" });

  // City label + weather — async, non-blocking, degrade to null on failure.
  useEffect(() => {
    let alive = true;
    getAreaLabel(coords).then((label) => alive && setCity(label.split(",").pop()?.trim() || label)).catch(() => {});
    fetch(`/api/weather?lat=${coords.lat.toFixed(2)}&lng=${coords.lng.toFixed(2)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((w) => alive && w && setWeather(w))
      .catch(() => {});
    return () => { alive = false; };
  }, [coords.lat, coords.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const hour = now.getHours();
  const value = useMemo<RouttSituation>(
    () => ({
      timeOfDay: timeOfDayFrom(hour),
      hour,
      location: { lat: coords.lat, lng: coords.lng, city, source: coords.source },
      weather,
      tripPhase,
      requestLocation,
      setManualLocation,
    }),
    [hour, coords.lat, coords.lng, coords.source, city, weather, tripPhase], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** App-wide situation hook. Throws outside <RouttProvider>. */
export function useRoutt(): RouttSituation {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRoutt must be used within <RouttProvider>");
  return v;
}
