// Google News sitemap: events updated in the last 48 hours.
import { sitemapRows } from "@/lib/data";

export const revalidate = 300;
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

export async function GET() {
  const { events } = await sitemapRows();
  const since = Date.now() - 48 * 3600_000;
  const items = events.filter((e) => +new Date(e.last_article_at) > since).slice(0, 1000).map((e) => `
  <url><loc>https://coda.news/event/${e.slug}</loc>
    <news:news><news:publication><news:name>coda.news</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${new Date(e.started_at).toISOString()}</news:publication_date><news:title>${esc(e.title)}</news:title></news:news></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}
</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
