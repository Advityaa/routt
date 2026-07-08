import type { Metadata } from "next";
import Showcase from "./Showcase";

// Internal-only design reference. Not linked anywhere; kept out of search.
export const metadata: Metadata = {
  title: "Routt — Design System",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <Showcase />;
}
