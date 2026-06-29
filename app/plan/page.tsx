import type { Metadata } from "next";
import Countdown from "@/components/trip/Countdown";

export const metadata: Metadata = {
  title: "Plan your trip — Routt countdown",
  description:
    "Enter your destination and trip date and Routt builds a personalised, date-anchored countdown: what to handle, when to handle it, and where to do each thing.",
};

export default function PlanPage() {
  return <Countdown />;
}
