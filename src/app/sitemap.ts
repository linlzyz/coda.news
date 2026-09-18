import type { MetadataRoute } from "next";
import { sitemapRows } from "@/lib/data";

const BASE = "https://coda.news";
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { events, companies, topics } = await sitemapRows();
  return [
    { url: BASE, changeFrequency: "always", priority: 1 },
    { url: `${BASE}/technology`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/economy`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/topics`, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE}/companies`, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.3 },
    ...events.map((e) => ({ url: `${BASE}/event/${e.slug}`, lastModified: e.last_article_at, changeFrequency: "hourly" as const, priority: 0.7, images: e.image_url ? [e.image_url.replace(/&/g, "&amp;")] : undefined })),
    ...topics.map((t) => ({ url: `${BASE}/topic/${t.slug}`, changeFrequency: "hourly" as const, priority: 0.6 })),
    ...companies.map((c) => ({ url: `${BASE}/company/${c.slug}`, changeFrequency: "daily" as const, priority: 0.4 })),
  ];
}
