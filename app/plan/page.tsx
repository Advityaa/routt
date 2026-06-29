import type { Metadata } from "next";
import Plan from "@/components/trip/Plan";
import { getTripCatalogue, getTripDestination } from "@/lib/trips";

export const metadata: Metadata = {
  title: "Plan your trip — Routt countdown",
  description:
    "Enter your destination and trip date and Routt builds a personalised, date-anchored countdown: what to handle, when to handle it, and where to do each thing.",
};

/** The plan is encoded in the URL (?dest=&date=) so it's shareable, no account. */
export default function PlanPage({
  searchParams,
}: {
  searchParams: { dest?: string; date?: string };
}) {
  const catalogue = getTripCatalogue();
  const requestedSlug = searchParams.dest ?? null;
  const destination = requestedSlug ? getTripDestination(requestedSlug) : null;
  const date = searchParams.date ?? null;

  return (
    <Plan
      catalogue={catalogue}
      destination={destination}
      requestedSlug={requestedSlug}
      date={date}
    />
  );
}
