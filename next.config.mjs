/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Foursquare user-photo CDN (public URLs, no key). Google photos come
      // through our own /api/photo proxy (same-origin); mock assets are local.
      { protocol: "https", hostname: "fastly.4sqi.net" },
      { protocol: "https", hostname: "images.unsplash.com" }, // homepage hero photo
    ],
  },
};

export default nextConfig;
