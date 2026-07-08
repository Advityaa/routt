import type { MetadataRoute } from "next";

/**
 * PWA web app manifest (Next.js metadata route — auto-linked into <head>).
 * Makes Routt installable. The offline service-worker / cache layer for
 * saved trips + arrival essentials is a separate, later task.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Routt",
    short_name: "Routt",
    description:
      "Right now, near you — what's genuinely worth going to.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
