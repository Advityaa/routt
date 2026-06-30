import type { Metadata } from "next";
import Canvas from "@/components/canvas/Canvas";
import { getTripCatalogue, getTripDestination } from "@/lib/trips";
import type { TripDestination } from "@/lib/trip-types";

export const metadata: Metadata = {
  title: "Your Canvas — Routt",
  description:
    "Your living travel canvas: create a trip and Routt issues a boarding pass, builds the countdown, surfaces experiences and savings, and grows your travel identity.",
};

/**
 * Loads the (server-only) per-destination task data + catalogue and hands it to
 * the client Canvas. The Canvas owns all state in localStorage (non-sensitive).
 */
export default function CanvasPage() {
  const catalogue = getTripCatalogue();
  const destinations = catalogue.map((d) => ({
    slug: d.slug,
    title: d.title,
    country: d.country,
  }));

  const taskData: Record<string, TripDestination> = {};
  for (const d of catalogue) {
    const td = getTripDestination(d.slug);
    if (td) taskData[d.slug] = td;
  }

  return <Canvas destinations={destinations} taskData={taskData} />;
}
