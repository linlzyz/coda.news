// RSS for readers and aggregators (Flipboard, SmartNews, NewsBreak, Feedly): every item carries a large image.
import { sitemapRows } from "@/lib/data";
import { shareImages } from "@/lib/share-image";

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

export async function feed(zh: boolean) {
  const { events } = await sitemapRows();
  const base = zh ? "https://coda.news/zh" : "https://coda.news";
  const self = zh ? "https://coda.news/feed-zh.xml" : "https://coda.news/feed.xml";
  const rows = events.filter((e) => !zh || e.title_zh).slice(0, 50);
  const items = rows.map((e) => {
    const t = (zh && e.title_zh) || e.title, d = (zh && e.summary_zh) || e.summary || "";
    const img = shareImages(e)[0];
    return `
  <item><title>${esc(t)}</title><link>${base}/event/${e.slug}</link><guid isPermaLink="true">${base}/event/${e.slug}</guid>
    <pubDate>${new Date(e.last_article_at).toUTCString()}</pubDate><category>${e.category}</category><dc:creator>coda.news</dc:creator>
    <description>${esc(d)}</description>
    <media:content url="${esc(img)}" medium="image" /><media:thumbnail url="${esc(img)}" /><enclosure url="${esc(img)}" type="image/${/opengraph-image|\.png/i.test(img) ? "png" : /\.webp/i.test(img) ? "webp" : "jpeg"}" length="0" /></item>`;
  }).join("");
  const title = zh ? "coda.news 中文" : "coda.news";
  const desc = zh ? "一件事，每一种视角。科技、经济、体育、娱乐与时尚大事，以及各国媒体如何报道。" : "One story. Every perspective. Technology, economy, sport, entertainment and fashion events, and how media in every country report them.";
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
  <title>${title}</title><link>${base}</link><description>${desc}</description>
  <language>${zh ? "zh-cn" : "en"}</language><atom:link href="${self}" rel="self" type="application/rss+xml" />
  <image><url>https://coda.news/icon.png</url><title>${title}</title><link>${base}</link></image>
  <lastBuildDate>${new Date(rows[0]?.last_article_at ?? Date.now()).toUTCString()}</lastBuildDate>${items}
</channel></rss>`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
