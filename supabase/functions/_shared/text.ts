// Small text helpers: RSS parsing, slugs, polite full-text fetch (internal analysis only).
import { XMLParser } from "fast-xml-parser";

export const UA = "Mozilla/5.0 (compatible; CodaNewsBot/0.1; +https://coda.news)";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text" });

export function clean(s: unknown): string {
  let t = typeof s === "string" ? s : (s && typeof s === "object" && "#text" in (s as object)) ? String((s as Record<string, unknown>)["#text"]) : s == null ? "" : String(s);
  t = t.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ");
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
       .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return t.replace(/\s+/g, " ").trim();
}

export interface FeedItem { title: string; url: string; summary: string; published: Date | null; image: string | null }

export function parseFeed(xml: string): FeedItem[] {
  const x = parser.parse(xml);
  let items = x?.rss?.channel?.item ?? x?.feed?.entry ?? x?.["rdf:RDF"]?.item ?? [];
  if (!Array.isArray(items)) items = [items];
  // deno-lint-ignore no-explicit-any
  return items.map((it: any) => {
    let link = it.link;
    if (Array.isArray(link)) link = link.find((l: any) => !l["@rel"] || l["@rel"] === "alternate") ?? link[0];
    if (link && typeof link === "object") link = link["@href"] ?? link["#text"];
    if (!link && typeof it.guid === "string" && it.guid.startsWith("http")) link = it.guid;
    if (!link && it.guid?.["#text"]?.startsWith?.("http")) link = it.guid["#text"];
    const d = it.pubDate ?? it.published ?? it.updated ?? it["dc:date"];
    const date = d ? new Date(clean(d)) : null;
    const media = it["media:content"] ?? it["media:thumbnail"] ?? it.enclosure;
    const m = Array.isArray(media) ? media[0] : media;
    const image = m?.["@url"] && (!m["@type"] || String(m["@type"]).startsWith("image")) ? String(m["@url"]) : null;
    return {
      title: clean(it.title),
      url: String(link ?? "").trim(),
      summary: clean(it.description ?? it.summary ?? it.content ?? "").slice(0, 600),
      published: date && !isNaN(+date) ? date : null,
      image,
    };
  }).filter((i: FeedItem) => i.title && i.url.startsWith("http"));
}

export function slugify(title: string, id: number | string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 70).replace(/-$/, "");
  return `${base || "event"}-${id}`;
}

// robots.txt cache per origin (in memory, per run)
const robots = new Map<string, string[]>();
async function allowed(u: URL): Promise<boolean> {
  if (!robots.has(u.origin)) {
    let dis: string[] = [];
    try {
      const r = await fetch(`${u.origin}/robots.txt`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        let applies = false;
        for (const raw of (await r.text()).split("\n")) {
          const line = raw.split("#")[0].trim(); const [k, ...rest] = line.split(":"); const v = rest.join(":").trim();
          if (/^user-agent$/i.test(k)) applies = v === "*" || /coda/i.test(v);
          else if (applies && /^disallow$/i.test(k) && v) dis.push(v);
        }
      }
    } catch { dis = []; }
    robots.set(u.origin, dis);
  }
  return !robots.get(u.origin)!.some((p) => u.pathname.startsWith(p.replace(/\*.*$/, "")));
}

/** Fetch readable text of an article for internal analysis only. Never stored long term, never shown. */
export async function fetchText(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (!(await allowed(u))) return null;
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await r.text()).slice(0, 1_500_000).replace(/<(script|style|noscript|svg|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ");
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter((p) => p.length > 40);
    const text = paras.join("\n").slice(0, 5000);
    return text.length > 200 ? text : null;
  } catch { return null; }
}
