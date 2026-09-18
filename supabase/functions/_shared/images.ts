// Images are decoration, never required. Order: official RSS image (set at ingest) → topic stock photo (Pexels API) → designed fallback in the UI.
// Stock photos are only searched with generic scene words, never company, product or person names.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

const TOPIC_QUERIES: Record<string, string[]> = {
  "artificial-intelligence": ["artificial intelligence abstract", "data center servers", "circuit board macro"],
  semiconductors: ["semiconductor wafer", "microchip macro", "clean room factory"],
  "big-tech": ["technology office", "smartphone hands", "laptop workspace"],
  economy: ["financial district skyline", "city business district", "central bank building"],
  markets: ["stock market screen", "trading charts screen", "financial data display"],
  trade: ["shipping containers port", "cargo ship", "container terminal"],
  "electric-vehicles": ["electric car charging", "ev charging station", "car factory assembly"],
  energy: ["solar panels", "wind turbines", "power lines sunset"],
  startups: ["startup office team", "modern office meeting", "coworking space"],
  crypto: ["cryptocurrency abstract", "blockchain abstract", "digital finance"],
};
const DEFAULT = ["global business city", "technology abstract", "world map lights"];

async function pexels(query: string): Promise<{ url: string; credit: string; link: string } | null> {
  const key = env("PEXELS_API_KEY"); if (!key) return null;
  const page = 1 + Math.floor(Math.random() * 3);
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=40&page=${page}`, {
    headers: { Authorization: key }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`pexels ${r.status}`);
  const j = await r.json();
  const photos = (j.photos ?? []) as { src: { large: string; landscape: string }; photographer: string; url: string }[];
  if (!photos.length) return null;
  // never reuse a photo another event already shows
  const urls = photos.map((p) => p.src.landscape || p.src.large);
  const used = new Set((await db()<{ image_url: string }[]>`select image_url from events where image_url in ${db()(urls)}`).map((r) => r.image_url));
  const fresh = photos.filter((p) => !used.has(p.src.landscape || p.src.large));
  if (!fresh.length) return null;
  const p = fresh[Math.floor(Math.random() * fresh.length)];
  return { url: p.src.landscape || p.src.large, credit: `${p.photographer} / Pexels`, link: p.url };
}

export async function assignImages(limit = 12): Promise<number> {
  if (!env("PEXELS_API_KEY")) return 0;
  const sql = db();
  const events = await sql<{ id: number; image_query: string | null; slugs: string[] | null }[]>`
    select e.id, e.image_query, (select array_agg(t.slug) from topics t where t.id = any(e.topic_ids)) as slugs
    from events e where e.image_url is null and e.image_checked_at is null and e.summary is not null
    order by e.importance desc, e.last_article_at desc limit ${limit}`;
  let n = 0;
  for (const e of events) {
    const pool = e.slugs?.flatMap((s) => TOPIC_QUERIES[s] ?? []) ?? [];
    const queries = [e.image_query, pool[Math.floor(Math.random() * pool.length)], DEFAULT[e.id % DEFAULT.length]].filter(Boolean) as string[];
    let img = null;
    for (const q of queries) { img = await pexels(q); if (img) break; }
    await sql`update events set image_checked_at = now(), image_url = coalesce(image_url, ${img?.url ?? null}),
              image_credit = coalesce(image_credit, ${img?.credit ?? null}), image_link = coalesce(image_link, ${img?.link ?? null}) where id = ${e.id}`;
    if (img) n++;
  }
  if (events.length) log(`images: ${n}/${events.length}`);
  return n;
}
