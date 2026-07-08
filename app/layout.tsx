import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import OfflineIndicator from "@/components/OfflineIndicator";
import BottomNav from "@/components/BottomNav";
import { RouttProvider } from "@/lib/context/RouttContext";

/**
 * Type system (light editorial, per the reference screens):
 * - display: Fraunces — large confident serif for headings and venue names.
 * - body:    Inter — clean grotesk for body/meta/UI.
 * - mono:    IBM Plex Mono — kept for credibility evidence/counts, so the
 *            reasoning reads like verified receipts, not marketing copy.
 * All self-hosted via next/font (no runtime fetch → offline-safe PWA).
 */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Routt",
  description:
    "Right now, near you — what's genuinely worth going to. A short, credibility-verified list of places to Eat, Drink, Shop, and See.",
  applicationName: "Routt",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Routt" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

// Mobile-first; installable full-screen PWA. theme-color tracks the active scheme.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF6ED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <RouttProvider>
          <ServiceWorkerRegistrar />
          <OfflineIndicator />
          {children}
          <BottomNav />
        </RouttProvider>
      </body>
    </html>
  );
}
