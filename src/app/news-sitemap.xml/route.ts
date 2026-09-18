// Google News sitemap: events updated in the last 48 hours.
import { sitemapRows } from "@/lib/data";

export const revalidate = 300;
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

export async function GET() {
  const { events } = await sitemapRows();
  const since = Date.now() - 48 * 3600_000;
  const recent = events.filter((e) => +new Date(e.last_article_at) > since).slice(0, 500);
  const item = (path: string, lang: string, title: string, date: string) => `
  <url><loc>https://coda.news${path}</loc>
    <news:news><news:publication><news:name>coda.news</news:name><news:language>${lang}</news:language></news:publication>
      <news:publication_date>${new Date(date).toISOString()}</news:publication_date><news:title>${esc(title)}</news:title></news:news></url>`;
  const items = recent.map((e) => item(`/event/${e.slug}`, "en", e.title, e.started_at)
    + (e.title_zh ? item(`/zh/event/${e.slug}`, "zh-cn", e.title_zh, e.started_at) : "")).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}
</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
