import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/search"] }],
    sitemap: ["https://coda.news/sitemap.xml", "https://coda.news/news-sitemap.xml"],
    host: "https://coda.news",
  };
}
