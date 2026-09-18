// Images are decoration, never required.
// Order: official RSS image (set at ingest) → Unsplash → Pexels → Pixabay (each by its own API terms) → designed cover in the UI.
// Stock photos are searched with scene words only (never company, product or person names), and a photo is never reused.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

type Img = { url: string; credit: string; link: string };

const TOPIC_QUERIES: Record<string, string[]> = {
  "artificial-intelligence": ["artificial intelligence abstract", "data center servers", "circuit board macro"],
  semiconductors: ["semiconductor wafer", "microchip macro", "clean room factory"],
  "big-tech": ["technology office", "smartphone hands", "laptop workspace"],
  economy: ["coins and banknotes", "calculator finance documents", "shopping street people"],
  markets: ["stock market screen", "trading charts screen", "financial newspaper"],
  trade: ["shipping containers port", "cargo ship", "container terminal"],
  "electric-vehicles": ["electric car charging", "ev charging station", "car factory assembly"],
  energy: ["solar panels", "wind turbines", "power lines sunset"],
  startups: ["startup office team", "modern office meeting", "coworking space"],
  crypto: ["cryptocurrency abstract", "blockchain abstract", "digital finance"],
  football: ["football stadium", "soccer ball field", "football fans stadium"], tennis: ["tennis court", "tennis ball racket"],
  cricket: ["cricket ground", "cricket ball"], basketball: ["basketball court", "basketball hoop"], motorsport: ["race track cars", "motorsport racing"],
  "olympic-sports": ["athletics track", "swimming pool race"], film: ["cinema theater seats", "film camera set"], music: ["concert crowd stage", "music festival"],
  "tv-streaming": ["watching tv living room", "remote control television"], gaming: ["video game controller", "gaming setup"],
  luxury: ["luxury boutique", "designer handbag display"], "fashion-week": ["fashion runway", "fashion show backstage"],
  "fashion-retail": ["clothing store rack", "shopping street fashion"], design: ["modern architecture interior", "design studio"],
};
const DEFAULT = ["business documents desk", "technology abstract", "world map"];
const exhausted = new Set<string>();

async function unused(candidates: Img[]): Promise<Img | null> {
  if (!candidates.length) return null;
  const sql = db();
  const used = new Set((await sql<{ image_url: string }[]>`select image_url from events where image_url in ${sql(candidates.map((c) => c.url))}`).map((r) => r.image_url));
  const fresh = candidates.filter((c) => !used.has(c.url));
  return fresh.length ? fresh[Math.floor(Math.random() * Math.min(fresh.length, 12))] : null;
}

// Unsplash: hotlink their URL, credit photographer + Unsplash, ping download_location when used.
async function unsplash(q: string): Promise<Img | null> {
  const key = env("UNSPLASH_ACCESS_KEY"); if (!key) return null;
  const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=30&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(10000) });
  if (r.status === 403 || r.status === 429) throw new Limit("unsplash");
  if (!r.ok) return null;
  const j = await r.json();
  const utm = "utm_source=coda.news&utm_medium=referral";
  // deno-lint-ignore no-explicit-any
  const list: (Img & { dl: string })[] = (j.results ?? []).map((p: any) => ({
    url: p.urls.regular, credit: `${p.user.name} / Unsplash`, link: `${p.user.links.html}?${utm}`, dl: p.links.download_location,
  }));
  const pick = await unused(list) as (Img & { dl?: string }) | null;
  if (pick?.dl) fetch(pick.dl, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
  return pick ? { url: pick.url, credit: pick.credit, link: pick.link } : null;
}

// Pexels: hotlink, credit photographer + Pexels.
async function pexels(q: string): Promise<Img | null> {
  const key = env("PEXELS_API_KEY"); if (!key) return null;
  const page = 1 + Math.floor(Math.random() * 3);
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&per_page=40&page=${page}`,
    { headers: { Authorization: key }, signal: AbortSignal.timeout(10000) });
  if (r.status === 429) throw new Limit("pexels");
  if (!r.ok) return null;
  const j = await r.json();
  // deno-lint-ignore no-explicit-any
  return unused((j.photos ?? []).map((p: any) => ({ url: p.src.landscape || p.src.large, credit: `${p.photographer} / Pexels`, link: p.url })));
}

// Pixabay: no permanent hotlinking → copy the image into our own storage, credit Pixabay.
async function pixabay(q: string): Promise<Img | null> {
  const key = env("PIXABAY_API_KEY"); if (!key) return null;
  const r = await fetch(`https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40`,
    { signal: AbortSignal.timeout(10000) });
  if (r.status === 429) throw new Limit("pixabay");
  if (!r.ok) return null;
  const j = await r.json();
  // deno-lint-ignore no-explicit-any
  const hits = (j.hits ?? []) as any[];
  const sql = db();
  const pages = hits.map((h) => h.pageURL as string);
  const usedPages = new Set((await sql<{ image_link: string }[]>`select image_link from events where image_link in ${sql(pages.length ? pages : [""])}`).map((x) => x.image_link));
  const fresh = hits.filter((h) => !usedPages.has(h.pageURL));
  if (!fresh.length) return null;
  const h = fresh[Math.floor(Math.random() * Math.min(fresh.length, 12))];
  const img = await fetch(h.largeImageURL || h.webformatURL, { signal: AbortSignal.timeout(15000) });
  if (!img.ok) return null;
  const base = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
  const secret = env("SUPABASE_SERVICE_ROLE_KEY");
  const path = `pixabay/${h.id}.jpg`;
  const up = await fetch(`${base}/storage/v1/object/images/${path}`, {
    method: "POST", headers: { apikey: secret, Authorization: `Bearer ${secret}`, "content-type": "image/jpeg", "x-upsert": "true" },
    body: await img.arrayBuffer(),
  });
  if (!up.ok) { log("pixabay upload failed", up.status); return null; }
  return { url: `${base}/storage/v1/object/public/images/${path}`, credit: `${h.user} / Pixabay`, link: h.pageURL };
}

// Wikimedia Commons: free licences only (public domain, CC0, CC BY, CC BY-SA), credit author + licence, link to the file page.
const FREE = /^(public domain|cc0|cc by(-sa)? \d|cc by(-sa)?$|pdm)/i;
const NOT_PHOTO = /\b(map|logo|diagram|chart|graph|flag|coat of arms|seal|emblem|screenshot|poster|icon|infographic|drawing|painting|portrait)\b/i;
async function commons(q: string): Promise<Img | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=20` +
    `&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280`;
  const r = await fetch(url, { headers: { "user-agent": "CodaNewsBot/0.1 (https://coda.news; hello@coda.news)" }, signal: AbortSignal.timeout(10000) });
  if (r.status === 429) throw new Limit("commons");
  if (!r.ok) return null;
  const j = await r.json();
  // deno-lint-ignore no-explicit-any
  const pages = Object.values(j.query?.pages ?? {}) as any[];
  const list: Img[] = [];
  for (const p of pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
    const ii = p.imageinfo?.[0]; const m = ii?.extmetadata ?? {};
    const lic = String(m.LicenseShortName?.value ?? "");
    if (!ii || ii.mime !== "image/jpeg" || ii.width < 1200 || ii.width < ii.height || !FREE.test(lic) || NOT_PHOTO.test(p.title)) continue;
    const artist = String(m.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 60) || "Unknown";
    list.push({ url: ii.thumburl ?? ii.url, credit: `${artist} / Wikimedia Commons (${lic})`, link: ii.descriptionurl });
  }
  return unused(list.slice(0, 6));
}

class Limit extends Error {}
const PROVIDERS: [string, (q: string) => Promise<Img | null>][] = [["unsplash", unsplash], ["pexels", pexels], ["pixabay", pixabay], ["commons", commons]];
// For the story's own place-aware query, real photos of that place (Commons) come first; generic scenes prefer stock libraries.
const PLACE_FIRST: [string, (q: string) => Promise<Img | null>][] = [["commons", commons], ["unsplash", unsplash], ["pexels", pexels], ["pixabay", pixabay]];

async function find(queries: string[], placeFirst = false): Promise<Img | null> {
  for (const [k, q] of queries.entries()) {
    for (const [name, fn] of k === 0 && placeFirst ? PLACE_FIRST : PROVIDERS) {
      if (exhausted.has(name)) continue;
      try { const img = await fn(q); if (img) return img; }
      catch (e) { if (e instanceof Limit) { exhausted.add(name); log(`images: ${name} hourly limit reached`); } }
    }
  }
  return null;
}

export async function assignImages(limit = 12): Promise<number> {
  const sql = db();
  const events = await sql<{ id: number; image_query: string | null; slugs: string[] | null }[]>`
    select e.id, e.image_query, (select array_agg(t.slug) from topics t where t.id = any(e.topic_ids)) as slugs
    from events e where e.image_url is null and e.image_checked_at is null and e.summary is not null
    order by e.importance desc, e.last_article_at desc limit ${limit}`;
  let n = 0;
  for (const e of events) {
    if (exhausted.size === PROVIDERS.length) break;
    const pool = e.slugs?.flatMap((s) => TOPIC_QUERIES[s] ?? []) ?? [];
    const queries = [e.image_query, pool[Math.floor(Math.random() * pool.length)], DEFAULT[e.id % DEFAULT.length]].filter(Boolean) as string[];
    const img = await find(queries, !!e.image_query);
    if (!img && exhausted.size === PROVIDERS.length) break;   // try again next run
    await sql`update events set image_checked_at = now(), image_url = coalesce(image_url, ${img?.url ?? null}),
              image_credit = coalesce(image_credit, ${img?.credit ?? null}), image_link = coalesce(image_link, ${img?.link ?? null}) where id = ${e.id}`;
    if (img) n++;
  }
  if (events.length) log(`images: ${n}/${events.length}`);
  return n;
}
