import type { MetadataRoute } from "next";
import { archiveDays, companyDirectory, notable, sitemapRows } from "@/lib/data";

const BASE = "https://coda.news";
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ events, topics }, days, dir] = await Promise.all([sitemapRows(), archiveDays(90), companyDirectory()]);
  // only company pages with something to read: a profile (description from Wikidata) or our coverage
  const companies = dir.filter((c) => notable(c) && (c.events > 0 || !!c.description));
  const both = (path: string) => ({ languages: { en: `${BASE}${path}`, "zh-CN": `${BASE}/zh${path === "/" ? "" : path}` } });
  const zh = (entries: MetadataRoute.Sitemap) => entries.map((x) => ({ ...x, url: x.url.replace(BASE, `${BASE}/zh`).replace(/\/zh\/$/, "/zh") }));
  const en: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "always" as const, priority: 1 },
    { url: `${BASE}/technology`, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${BASE}/economy`, changeFrequency: "hourly" as const, priority: 0.8 },
    ...["sport", "entertainment", "fashion", "travel", "automotive", "gaming", "australia", "china"].map((s) => ({ url: `${BASE}/${s}`, changeFrequency: "hourly" as const, priority: 0.7 })),
    { url: `${BASE}/topics`, changeFrequency: "daily" as const, priority: 0.5 },
    { url: `${BASE}/companies`, changeFrequency: "daily" as const, priority: 0.5 },
    { url: `${BASE}/about`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE}/corrections`, changeFrequency: "daily" as const, priority: 0.3 },
    { url: `${BASE}/archive`, changeFrequency: "daily" as const, priority: 0.4 },
    ...days.map(([d]) => ({ url: `${BASE}/archive/${d}`, changeFrequency: "daily" as const, priority: 0.4 })),
    ...events.map((e) => ({ url: `${BASE}/event/${e.slug}`, lastModified: e.last_article_at, changeFrequency: "daily" as const, priority: 0.7, images: e.image_url ? [e.image_url.replace(/&/g, "&amp;")] : undefined })),
    ...topics.map((t) => ({ url: `${BASE}/topic/${t.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...companies.map((c) => ({ url: `${BASE}/company/${c.slug}`, changeFrequency: "daily" as const, priority: 0.4 })),
  ].map((x) => ({ ...x, alternates: both(x.url.replace(BASE, "") || "/") }));
  return [...en, ...zh(en)];
}
