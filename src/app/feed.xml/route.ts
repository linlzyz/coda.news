// RSS feed of the latest events.
import { sitemapRows } from "@/lib/data";

export const revalidate = 300;
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

export async function GET() {
  const { events } = await sitemapRows();
  const items = events.slice(0, 50).map((e) => `
  <item><title>${esc(e.title)}</title><link>https://coda.news/event/${e.slug}</link><guid>https://coda.news/event/${e.slug}</guid>
    <pubDate>${new Date(e.last_article_at).toUTCString()}</pubDate><category>${e.category}</category><description>${esc(e.summary ?? "")}</description></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
  <title>coda.news</title><link>https://coda.news</link><description>One story. Every perspective. Technology and economy events, and how media in every country report them.</description>
  <language>en</language><atom:link href="https://coda.news/feed.xml" rel="self" type="application/rss+xml" />${items}
</channel></rss>`, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
