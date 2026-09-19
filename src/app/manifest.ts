import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "coda.news",
    short_name: "coda.news",
    description: "One story. Every perspective. How media in each country report the same event.",
    start_url: "/?source=pwa",
    id: "/",
    orientation: "portrait",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16181D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
