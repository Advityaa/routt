"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side Canvas store (localStorage). Holds ONLY non-sensitive data:
 * a playful display name + theme, trips (destination/dates/checklist progress),
 * and a self-declared list of visited country codes for the world %.
 *
 * NO passport numbers, scans, or government IDs — ever. The "passport" here is
 * a playful travel identity, nothing more.
 */

const KEY = "routt.canvas.v1";

export interface CanvasTrip {
  id: string;
  destination: string; // slug
  cityName: string;
  homeCity: string;
  tripDate: string; // YYYY-MM-DD
  done: string[]; // checked-off task ids
  createdAt: string; // YYYY-MM-DD
}

export interface CanvasData {
  name: string;
  theme: string;
  trips: CanvasTrip[];
  activeTripId: string | null;
  visited: string[]; // ISO-ish country codes
}

const EMPTY: CanvasData = {
  name: "",
  theme: "✈️", // playful avatar (identity only)
  trips: [],
  activeTripId: null,
  visited: [],
};

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `t-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${`${n.getMonth() + 1}`.padStart(2, "0")}-${`${n.getDate()}`.padStart(2, "0")}`;
}

export function useCanvas() {
  const [data, setData] = useState<CanvasData>(EMPTY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...EMPTY, ...(JSON.parse(raw) as Partial<CanvasData>) });
    } catch {
      /* corrupt storage — start fresh */
    }
  }, []);

  const persist = useCallback((next: CanvasData) => {
    setData(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — in-memory still works this session */
    }
  }, []);

  const createTrip = useCallback(
    (input: { destination: string; cityName: string; homeCity: string; tripDate: string }) => {
      const id = newId();
      setData((prev) => {
        const trip: CanvasTrip = {
          id,
          destination: input.destination,
          cityName: input.cityName,
          homeCity: input.homeCity || "Home",
          tripDate: input.tripDate,
          done: [],
          createdAt: todayISO(),
        };
        const next = { ...prev, trips: [trip, ...prev.trips], activeTripId: id };
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      return id;
    },
    []
  );

  const setActiveTrip = useCallback(
    (id: string) => persist({ ...data, activeTripId: id }),
    [data, persist]
  );

  const deleteTrip = useCallback(
    (id: string) => {
      const trips = data.trips.filter((t) => t.id !== id);
      persist({
        ...data,
        trips,
        activeTripId: data.activeTripId === id ? (trips[0]?.id ?? null) : data.activeTripId,
      });
    },
    [data, persist]
  );

  const toggleTask = useCallback(
    (tripId: string, taskId: string) => {
      persist({
        ...data,
        trips: data.trips.map((t) =>
          t.id !== tripId
            ? t
            : {
                ...t,
                done: t.done.includes(taskId)
                  ? t.done.filter((d) => d !== taskId)
                  : [...t.done, taskId],
              }
        ),
      });
    },
    [data, persist]
  );

  const setName = useCallback((name: string) => persist({ ...data, name }), [data, persist]);
  const setTheme = useCallback((theme: string) => persist({ ...data, theme }), [data, persist]);

  const toggleVisited = useCallback(
    (code: string) =>
      persist({
        ...data,
        visited: data.visited.includes(code)
          ? data.visited.filter((c) => c !== code)
          : [...data.visited, code],
      }),
    [data, persist]
  );

  const reset = useCallback(() => persist(EMPTY), [persist]);

  /** Earned stamps = unique destinations across all trips. */
  const stamps = Array.from(new Set(data.trips.map((t) => t.destination)));
  const activeTrip = data.trips.find((t) => t.id === data.activeTripId) ?? data.trips[0] ?? null;

  return {
    mounted,
    data,
    activeTrip,
    stamps,
    createTrip,
    setActiveTrip,
    deleteTrip,
    toggleTask,
    setName,
    setTheme,
    toggleVisited,
    reset,
  };
}
