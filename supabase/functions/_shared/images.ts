// Images are decoration, never required.
// Order: Unsplash → Pexels → Pixabay → Wikimedia Commons → Openverse (each by its own licence) → designed cover in the UI.
// Place-specific queries try Commons and Openverse first. Only CC0, public domain, CC BY and CC BY-SA are accepted from open sources;
// NC, ND and unclear licences are rejected. Publisher and news-agency photos are never used.
// Stock photos are searched with scene words only (never company, product or person names), and a photo is never reused.
import { db } from "./db.ts";
import { env, log } from "./env.ts";
import { cheapJSON } from "./ai.ts";
import { UA as BOT } from "./text.ts";

export type Img = { url: string; credit: string; link: string; source?: string; license?: string; licenseUrl?: string };

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
  "tv-streaming": ["tv studio camera", "film set lights"], gaming: ["video game controller", "gaming setup"],
  luxury: ["luxury boutique", "designer handbag display"], "fashion-week": ["fashion runway", "fashion show backstage"],
  "fashion-retail": ["clothing store rack", "shopping street fashion"], design: ["modern architecture interior", "design studio"],
  aviation: ["airplane taking off", "airport terminal"], tourism: ["tourists city street", "travel suitcase airport"],
};
const DEFAULT = ["business documents desk", "technology abstract", "world map"];
const exhausted = new Set<string>();

// a stock photo must actually show the query: at least one meaningful query word appears in its description or tags
const STOP = new Set("a an the of in on at and or for with to from by new old modern generic scene photo".split(" "));
const relevant = (q: string, text: string, all = false) => {
  const words = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const t = ` ${text.toLowerCase()} `;
  const hit = (w: string) => t.includes(w.replace(/s$/, ""));
  // stock libraries: at least two of the query's words (or all, if it has fewer), so "trading cards" never finds a card magician
  if (GRIM.test(t)) return false;   // never a sad or morbid picture, whatever the query matched
  return words.length > 0 && (all ? words.every(hit) : words.filter(hit).length >= Math.min(2, words.length));
};
const GRIM = /\b(grave|graves|gravestone|tombstone|tomb|cemetery|graveyard|burial|funeral|coffin|memorial|mourning|skull|skeleton|death|dead|war|soldier|ruin|ruins|abandoned|derelict|decay|rubble|disaster|flood|fire|smoke|protest|riot|police|prison|hospital|sick|blood|injury|crash|accident|trash|garbage|pollution)s?\b/i;
// open archives (Commons, Openverse) hold documentary photos of protests, wars and people; they must match every word, and never show these
const SENSITIVE = /\b(protest|rally in support|demonstrat|riot\b|war\b|soldier|military|funeral|victim|refugee|police|arrest|blood|weapon|gun\b|guns\b|flag of|ukrain|russia|israel|gaza|palestin|politic|election|campaign|march for|strike\b)/i;

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
  // deno-lint-ignore no-explicit-any
  const list: (Img & { dl: string })[] = (j.results ?? []).filter((p: any) => relevant(q, `${p.alt_description ?? ""} ${p.description ?? ""} ${(p.tags ?? []).map((t: any) => t.title).join(" ")}`)).map((p: any) => ({
    url: p.urls.regular, credit: `${p.user.name} / Unsplash`, link: `${p.user.links.html}?${utm}`, dl: p.links.download_location,
    source: "unsplash", license: "Unsplash License", licenseUrl: "https://unsplash.com/license",
  }));
  const pick = await unused(list) as (Img & { dl?: string }) | null;
  if (pick?.dl) fetch(pick.dl, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
  if (!pick) return null;
  const { dl: _dl, ...img } = pick;
  return img;
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
  // deno-lint-ignore no-explicit-any
  return unused((j.photos ?? []).filter((p: any) => relevant(q, `${p.alt ?? ""} ${p.url ?? ""}`)).map((p: any) => ({ url: p.src.landscape || p.src.large, credit: `${p.photographer} / Pexels`, link: p.url, source: "pexels", license: "Pexels License", licenseUrl: "https://www.pexels.com/license/" })));
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
  const hits = ((j.hits ?? []) as any[]).filter((h) => relevant(q, `${h.tags ?? ""}`));
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
  return { url: `${base}/storage/v1/object/public/images/${path}`, credit: `${h.user} / Pixabay`, link: h.pageURL,
    source: "pixabay", license: "Pixabay Content License", licenseUrl: "https://pixabay.com/service/license-summary/" };
}

// Wikimedia Commons: free licences only (public domain, CC0, CC BY, CC BY-SA), credit author + licence, link to the file page.
const FREE = /^(public domain|cc0|cc by(-sa)? \d|cc by(-sa)?$|pdm)/i;
const NOT_PHOTO = /\b(map|logo|diagram|chart|graph|flag|coat of arms|seal|emblem|screenshot|poster|icon|infographic|drawing|painting|portrait)\b/i;
async function commons(q: string): Promise<Img | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=20` +
    `&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280`;
  const r = await fetch(url, { headers: { "user-agent": "CodaNewsBot/0.1 (https://coda.news; info@coda.news)" }, signal: AbortSignal.timeout(10000) });
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
    const about = `${p.title} ${String(m.ImageDescription?.value ?? "").replace(/<[^>]+>/g, " ")} ${String(m.Categories?.value ?? "")}`;
    if (!relevant(q, about, true) || SENSITIVE.test(about)) continue;
    const artist = String(m.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 60) || "Unknown";
    list.push({ url: ii.thumburl ?? ii.url, credit: `${artist} / Wikimedia Commons (${lic})`, link: ii.descriptionurl,
      source: "commons", license: lic, licenseUrl: String(m.LicenseUrl?.value ?? "") || undefined });
  }
  return unused(list.slice(0, 6));
}

// Openverse: open-licence photos gathered from Flickr and other archives; same licence rule as Commons.
const OV_LIC: Record<string, string> = { cc0: "CC0", pdm: "Public domain", by: "CC BY", "by-sa": "CC BY-SA" };
async function openverse(q: string): Promise<Img | null> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0,pdm,by,by-sa&category=photograph&aspect_ratio=wide&size=large&mature=false&page_size=20`;
  const r = await fetch(url, { headers: { "user-agent": "CodaNewsBot/0.1 (https://coda.news; info@coda.news)" }, signal: AbortSignal.timeout(12000) });
  if (r.status === 429 || r.status === 401) throw new Limit("openverse");
  if (!r.ok) return null;
  const j = await r.json();
  const list: Img[] = [];
  // deno-lint-ignore no-explicit-any
  for (const p of (j.results ?? []) as any[]) {
    const base = OV_LIC[p.license];
    const tags = (p.tags ?? []).map((t: { name: string }) => t.name).join(" ");
    if (!base || !p.url || !p.foreign_landing_url || p.source === "wikimedia" || NOT_PHOTO.test(`${p.title} ${tags}`) || /illustration|manipulation|photoshop|render/i.test(`${p.title} ${tags}`)) continue;
    if (!relevant(q, `${p.title ?? ""} ${tags}`, true) || SENSITIVE.test(`${p.title ?? ""} ${tags}`)) continue;
    const lic = base.startsWith("CC BY") && p.license_version ? `${base} ${p.license_version}` : base;
    const where = String(p.source ?? p.provider ?? "Openverse").replace(/^\w/, (c: string) => c.toUpperCase());
    list.push({ url: p.url, credit: `${String(p.creator ?? "Unknown").slice(0, 60)} / ${where} via Openverse (${lic})`, link: p.foreign_landing_url,
      source: "openverse", license: lic, licenseUrl: p.license_url ?? undefined });
  }
  return unused(list.slice(0, 8));
}

// A real portrait of the person the story is about: their Wikidata entry's main image (P18), which always lives on Commons.
// We check it is a human with that exact name, and that the file's licence is free, before using it.
const UA = { "user-agent": "CodaNewsBot/0.1 (https://coda.news; info@coda.news)" };
export async function personPhoto(name: string, eventId: number): Promise<Img | null> {
  const w = "https://www.wikidata.org/w/api.php?format=json&";
  const s = await (await fetch(`${w}action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=5`, { headers: UA, signal: AbortSignal.timeout(10000) })).json();
  const ids: string[] = (s.search ?? []).map((x: { id: string }) => x.id);
  if (!ids.length) return null;
  const j = await (await fetch(`${w}action=wbgetentities&ids=${ids.join("|")}&props=labels|aliases|claims&languages=en|mul`, { headers: UA, signal: AbortSignal.timeout(10000) })).json();
  const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // deno-lint-ignore no-explicit-any
  const person = ids.map((id) => j.entities?.[id]).find((e: any) => e &&
    (e.claims?.P31 ?? []).some((c: any) => c.mainsnak?.datavalue?.value?.id === "Q5") && e.claims?.P18 &&
    [e.labels?.en?.value, e.labels?.mul?.value, ...(e.aliases?.en ?? []).map((a: any) => a.value), ...(e.aliases?.mul ?? []).map((a: any) => a.value)].filter(Boolean).some((n: string) => norm(n) === norm(name)));
  if (!person) return null;
  // only the portrait Wikidata editors chose for this person (P18); other Commons files are too often group shots or CD covers
  const files = new Set<string>();
  for (const c of person.claims?.P18 ?? []) { const f = c?.mainsnak?.datavalue?.value; if (typeof f === "string" && c.rank !== "deprecated") files.add("File:" + f); }
  if (!files.size) return null;
  const ii = await (await fetch(`https://commons.wikimedia.org/w/api.php?format=json&action=query&titles=${encodeURIComponent([...files].slice(0, 30).join("|"))}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600`, { headers: UA, signal: AbortSignal.timeout(12000) })).json();
  // deno-lint-ignore no-explicit-any
  const infos = (Object.values(ii.query?.pages ?? {}) as any[]).map((pg) => pg.imageinfo?.[0]).filter((i) => i &&
    /^image\/(jpeg|png)$/.test(i.mime) && FREE.test(String(i.extmetadata?.LicenseShortName?.value ?? "")) &&
    i.height >= 700 && i.width >= 500)   // shown whole (not cropped), so this is sharp enough
    .sort((x, y) => (y.width * y.height) - (x.width * x.height));
  const sql = db();
  for (const info of infos) {
    const m = info.extmetadata ?? {};
    const lic = String(m.LicenseShortName?.value ?? "");
    const artist = String(m.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 60) || "Unknown";
    const url = info.thumburl ?? info.url;
    void sql; void eventId;   // the same person's portrait may appear on several of their stories
    return { url, credit: `${artist} / Wikimedia Commons (${lic})`, link: info.descriptionurl, source: "commons", license: lic, licenseUrl: String(m.LicenseUrl?.value ?? "") || undefined };
  }
  return null;
}

class Limit extends Error {}
const PROVIDERS: [string, (q: string) => Promise<Img | null>][] = [["unsplash", unsplash], ["pexels", pexels], ["pixabay", pixabay]];
// open archives (Commons, Openverse) kept out of scene search: their documentary photos matched too many wrong stories
// For the story's own place-aware query, real photos of that place (Commons) come first; generic scenes prefer stock libraries.
const PLACE_FIRST = PROVIDERS; void commons; void openverse;

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

// Stories without a scene description get one from the cheap model (title only), so the stock search has something specific to look for.
async function fillQueries(max = 80) {
  const sql = db();
  const rows = await sql<{ id: number; title: string }[]>`select id, title from events where summary is not null and coalesce(image_query, '') = '' and image_url is null
    and status <> 'archived' order by last_article_at desc limit ${max}`;
  if (!rows.length) return;
  const prompt = `For each news headline:
q = 2 to 4 English words for a stock photo that shows what the story is about (the activity, place or object), e.g. "fitness race athletes", "steam locomotive", "tokyo stock exchange". No brand or person names, and never people as the subject (no models, runways or outfits). For travel stories use an inviting scenic view of the place, e.g. "dubrovnik old town coast", "kyoto temple garden", "luxury hotel pool".
Write q = "" when a generic stock photo would be wrong or tasteless: a person's illness, health, surgery, death, grief, relationships, pregnancy, crime, court case or scandal, and any story that is really about one person.
p = the full name of the one well-known person the story is about, or "".
b = the one brand, franchise or company the story is mainly about (e.g. "Pokémon", "Dior", "Toyota"), or "".
Return JSON only, one entry for EVERY item: {"r":{"1":{"q":"...","p":"","b":"Pokémon"},"2":{"q":"","p":"Nicole Polizzi","b":""}}}
${rows.map((r, k) => `${k + 1}. ${r.title}`).join("\n")}`;
  try {
    const res = await cheapJSON<{ r?: Record<string, { q?: string; p?: string; b?: string } | string> }>(prompt);
    for (const [k, r] of rows.entries()) {
      const v = res.r?.[String(k + 1)];
      if (v === undefined) continue;
      const q = String(typeof v === "string" ? v : v.q ?? "").replace(/[^\p{L}\p{N} -]/gu, " ").trim().slice(0, 60);
      const p = typeof v === "string" ? "" : String(v.p ?? "").trim().slice(0, 80);
      const b = typeof v === "string" ? "" : String(v.b ?? "").trim().slice(0, 80);
      // "-" = no stock photo for this story: a real portrait, a logo or our designed cover instead
      await sql`update events set image_query = ${q || "-"}, image_checked_at = null,
                image_person = coalesce(image_person, ${p || null}), image_brand = coalesce(image_brand, ${b || null}),
                brand_checked_at = case when ${!!b} and image_brand is null then null else brand_checked_at end, person_checked_at = case when ${!!p} and image_person is null then null else person_checked_at end where id = ${r.id}`;
    }
  } catch (e) { log("image queries:", (e as Error).message.slice(0, 120)); }
}


// Publicity images (game key art, product shots, film posters) that the story's own article uses: publishers hand these out for coverage.
// Never news-agency photos, never site logos or default share images.
const AGENCY = /getty|gettyimages|apimages|\bap\.org|reuters|afp\b|afpforum|shutterstock|alamy|\bepa\b|epa-images|aap\.com|paimages|imago|zumapress|sipa|abaca|bloomberg|wireimage|splash|backgrid|mega-agency/i;
const NOT_ART = /logo|default|placeholder|fallback|favicon|sprite|avatar|brand[-_]|share[-_]?image|og[-_]?default|social[-_]?card/i;
async function pressImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": BOT, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 400_000);
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::src)?["'][^>]*>/i)?.[0];
    let img = m?.match(/content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&");
    if (!img) return null;
    img = new URL(img, r.url).toString();
    if (!/^https:/.test(img) || AGENCY.test(img) || NOT_ART.test(img)) return null;
    // the page's own credit line near the top mentions an agency: skip
    if (AGENCY.test(html.slice(0, 200_000).match(/(photo|image|credit)[^<]{0,80}/gi)?.join(" ") ?? "")) return null;
    const h = await fetch(img, { method: "GET", headers: { "user-agent": "Mozilla/5.0", referer: "https://coda.news/", range: "bytes=0-0" }, signal: AbortSignal.timeout(6000) });
    const type = h.headers.get("content-type") ?? "";
    const size = Number(h.headers.get("content-range")?.split("/")[1] ?? h.headers.get("content-length") ?? 0);
    await h.body?.cancel();
    if (!h.ok || !/image\/(jpeg|png|webp)/.test(type) || size < 40_000) return null;
    return img;
  } catch { return null; }
}

// IGDB (Twitch's game database): official covers, key art and screenshots for the game a story is about.
let igdbToken: string | null = null;
async function igdb(body: string): Promise<any[]> {
  const id = env("IGDB_CLIENT_ID"), secret = env("IGDB_CLIENT_SECRET");
  if (!id || !secret) return [];
  if (!igdbToken) {
    const t = await (await fetch(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`, { method: "POST", signal: AbortSignal.timeout(8000) })).json();
    igdbToken = t.access_token ?? null; if (!igdbToken) return [];
  }
  const r = await fetch("https://api.igdb.com/v4/games", { method: "POST", headers: { "Client-ID": id, Authorization: `Bearer ${igdbToken}` }, body, signal: AbortSignal.timeout(8000) });
  return r.ok ? await r.json() : [];
}
const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
async function gameArt(name: string): Promise<(Img & { focus: string | null }) | null> {
  const list = await igdb(`search "${name.replace(/"/g, "")}"; fields name,url,cover.image_id,artworks.image_id,screenshots.image_id; limit 5;`);
  const want = norm(name);
  const g = list.find((x) => norm(x.name) === want) ?? list.find((x) => norm(x.name).startsWith(want) || want.startsWith(norm(x.name)));
  if (!g) return null;
  const art = g.artworks?.[0]?.image_id ?? g.screenshots?.[0]?.image_id;
  const pick = art ? { id: art, focus: null } : g.cover?.image_id ? { id: g.cover.image_id, focus: "top" } : null;
  if (!pick) return null;
  return { url: `https://images.igdb.com/igdb/image/upload/t_1080p/${pick.id}.jpg`, credit: `${g.name} / IGDB`, link: g.url ?? "https://www.igdb.com",
    source: "igdb", license: "Publicity image", focus: pick.focus };
}

// the logo of a brand or franchise that is not one of our companies (e.g. Pokémon), straight from its Wikidata entry
async function wikiLogo(name: string): Promise<string | null> {
  try {
    const w = "https://www.wikidata.org/w/api.php?format=json&";
    const s = await (await fetch(`${w}action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=3`, { headers: UA, signal: AbortSignal.timeout(8000) })).json();
    const hit = (s.search ?? []).find((x: { label?: string }) => norm(x.label ?? "") === norm(name));
    if (!hit) return null;
    const c = await (await fetch(`${w}action=wbgetclaims&entity=${hit.id}&property=P154`, { headers: UA, signal: AbortSignal.timeout(8000) })).json();
    const file = c.claims?.P154?.find((x: { rank: string }) => x.rank !== "deprecated")?.mainsnak?.datavalue?.value as string | undefined;
    return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}?width=640` : null;
  } catch { return null; }
}

export async function assignImages(limit = 12): Promise<number> {
  const sql = db();
  await fillQueries();
  // 1) stories about one well-known person: swap a stock photo (or nothing) for a real, free portrait of them
  const people = await sql<{ id: number; image_person: string; title: string; image_focus: string | null }[]>`
    select id, image_person, title, image_focus from events where image_person is not null and person_checked_at is null and summary is not null
      and source_count >= 2   -- one-source stories get only an official image (publisher, logo, game art) or none
      and (image_url is null or image_source in ('pexels','unsplash','pixabay','openverse','commons','logo'))
    order by importance desc, last_article_at desc limit ${limit * 3}`;
  let swapped = 0;
  for (const p of people) {
    let img: Img | null = null;
    // products named after people (e.g. NVIDIA's "Vera Rubin" chips) must not get that person's portrait
    const esc = p.image_person.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const product = new RegExp(`${esc}\\s+(NVL|system|chip|gpu|platform|architecture|supercomputer|telescope|observatory|model|series|edition|award|prize|trophy|cup|stadium|arena)`, "i").test(p.title);
    try { if (!product) img = await personPhoto(p.image_person, p.id); } catch (e) { log("person photo", p.image_person, (e as Error).message); }
    if (img) {
      await sql`update events set image_url = ${img.url}, image_credit = ${img.credit}, image_link = ${img.link}, image_source = ${img.source ?? null},
                image_license = ${img.license ?? null}, image_license_url = ${img.licenseUrl ?? null}, image_fetched_at = now(), image_checked_at = now(),
                person_checked_at = now(), image_focus = 'top' where id = ${p.id}`;
      swapped++;
    } else if (p.image_focus === "top") {
      // an earlier portrait no longer passes (e.g. too small): drop it so a normal photo is found instead
      await sql`update events set image_url = null, image_credit = null, image_link = null, image_source = null, image_license = null, image_license_url = null,
                image_checked_at = null, image_focus = null, brand_checked_at = null, person_checked_at = now() where id = ${p.id}`;
    } else await sql`update events set person_checked_at = now() where id = ${p.id}`;
  }
  if (people.length) log(`images: ${swapped}/${people.length} person portraits`);

  // 1a) game stories: the game's official art from IGDB (name picked out of the headline by the cheap model)
  const games = await sql<{ id: number; title: string }[]>`
    select id, title from events where category = 'gaming' and game_checked_at is null and summary is not null and status <> 'archived'
      and coalesce(image_focus, '') <> 'top' order by last_article_at desc limit 40`;
  if (games.length && env("IGDB_CLIENT_ID")) {
    let names: Record<string, string> = {};
    try {
      names = (await cheapJSON<{ g: Record<string, string> }>(`For each headline, give the exact title of the one video game it is about, or "" if it is not about one specific game (e.g. a studio, console, company or industry story).
Return JSON only: {"g":{"1":"Fire Emblem: Fortune's Weave","2":""}}
${games.map((g, i) => `${i + 1}. ${g.title}`).join("\n")}`)).g ?? {};
    } catch { names = {}; }
    let gameN = 0;
    for (const [i, g] of games.entries()) {
      const name = (names[String(i + 1)] ?? "").trim();
      const img = name ? await gameArt(name).catch(() => null) : null;
      if (img) {
        await sql`update events set image_url = ${img.url}, image_credit = ${img.credit}, image_link = ${img.link}, image_source = 'igdb', image_license = ${img.license ?? null},
                  image_license_url = null, image_focus = ${img.focus}, image_checked_at = now(), brand_checked_at = now(), press_checked_at = now(), game_checked_at = now() where id = ${g.id}`;
        gameN++;
      } else await sql`update events set game_checked_at = now() where id = ${g.id}`;
    }
    log(`images: ${gameN}/${games.length} game art`);
  }

  // 1b) games, cars, tech products, travel, films: the publicity image used by the story's own article
  const press = await sql<{ id: number; arts: { url: string; source: string }[] }[]>`
    select e.id, (select json_agg(x) from (select a.url, s.name as source from articles a join sources s on s.id = a.source_id
                   where a.event_id = e.id order by s.type = 'official' desc, a.published_at desc limit 4) x) as arts
    from events e
    where e.press_checked_at is null and e.summary is not null and e.status <> 'archived'
      -- games and cars: sites run the maker's press shots; films, shows and products only for launches, trailers and reveals (not people stories)
      and (e.category in ('gaming','automotive')
        or (e.category in ('entertainment','technology','economy','fashion','travel') and e.image_person is null
            and e.title ~* '(trailer|teaser|poster|first look|key art|launch|unveil|reveal|announce|release|debut|premiere|season [0-9]|sequel|album|game|console|phone|iphone|galaxy|pixel|laptop|headset|watch)'))
      and (e.image_url is null or e.image_source in ('pexels','unsplash','pixabay','logo'))
    order by e.last_article_at desc limit 25`;
  let pressN = 0;
  for (const p of press) {
    // every article in the story, official ones first: one site blocking us should not leave the story without its image
    let img: string | null = null, from: { url: string; source: string } | null = null;
    for (const a of p.arts ?? []) {
      const x = await pressImage(a.url);
      if (x && !(await sql`select 1 from events where image_url = ${x} limit 1`).length) { img = x; from = a; break; }
    }
    if (img && from) {
      await sql`update events set image_url = ${img}, image_credit = ${from.source}, image_link = ${from.url}, image_source = 'press', image_license = 'Publicity image',
                image_license_url = null, image_focus = null, image_checked_at = now(), brand_checked_at = now(), press_checked_at = now() where id = ${p.id}`;
      pressN++;
    } else await sql`update events set press_checked_at = now() where id = ${p.id}`;
  }
  if (press.length) log(`images: ${pressN}/${press.length} publicity images`);

  // 2) stories about a brand with a known logo (and no person photo): the brand's logo beats a generic stock photo
  const brands = await sql<{ id: number; logo: string }[]>`
    select e.id, replace(c.logo_url, 'width=320', 'width=640') as logo from events e
      join companies c on c.id = any(e.company_ids) and (lower(c.name) = lower(e.image_brand)
        -- no brand named, but the story is plainly about its one company (named in the headline)
        or (e.image_brand is null and cardinality(e.company_ids) = 1 and e.title ~* ('(^|[^a-z])' || regexp_replace(c.name, '([.^$*+?()\\[\\]{}|\\\\])', '\\\\\\1', 'g') || '($|[^a-z])')))
    where e.brand_checked_at is null and e.summary is not null and c.logo_url is not null and coalesce(e.image_focus, '') <> 'top'
      and (e.image_url is null or e.image_source in ('pexels','unsplash','pixabay','openverse','commons'))
    order by e.importance desc, e.last_article_at desc limit 300`;
  for (const b of brands) {
    await sql`update events set image_url = ${b.logo}, image_credit = 'Logo: Wikimedia Commons', image_link = null, image_source = 'logo', image_license = null,
              image_license_url = null, image_focus = 'logo', image_checked_at = now(), brand_checked_at = now() where id = ${b.id}`;
  }
  if (brands.length) log(`images: ${brands.length} brand logos`);
  // brands and franchises we do not track as companies
  const loose = await sql<{ id: number; image_brand: string }[]>`
    select id, image_brand from events where brand_checked_at is null and image_brand is not null and summary is not null and status <> 'archived'
      and coalesce(image_focus, '') <> 'top' and (image_url is null or image_source in ('pexels','unsplash','pixabay'))
    order by last_article_at desc limit 20`;
  for (const b of loose) {
    const logo = await wikiLogo(b.image_brand);
    if (logo) await sql`update events set image_url = ${logo}, image_credit = 'Logo: Wikimedia Commons', image_link = null, image_source = 'logo', image_license = null,
              image_license_url = null, image_focus = 'logo', image_checked_at = now(), brand_checked_at = now() where id = ${b.id}`;
    else await sql`update events set brand_checked_at = now() where id = ${b.id}`;
  }
  await sql`update events set brand_checked_at = now() where brand_checked_at is null and summary is not null and image_url is not null and image_source not in ('pexels','unsplash','pixabay','openverse','commons')`;

  const events = await sql<{ id: number; image_query: string | null; slugs: string[] | null }[]>`
    select e.id, e.image_query, (select array_agg(t.slug) from topics t where t.id = any(e.topic_ids)) as slugs
    from events e where e.image_url is null and e.image_checked_at is null and e.summary is not null
      -- people stories get a real portrait or our cover, never a stock photo; nor do stories about illness, death or crime
      and e.image_person is null
      -- fashion: a stock model reads as the brand's own collection, so fashion gets the brand's logo, a press image or our cover instead
      -- one-source stories: only the publisher's own image, a logo or a real portrait; never a stock photo (retried once a second source arrives)
      and e.source_count >= 2
      and e.category <> 'fashion' and coalesce(e.image_query, '') !~* '(runway|catwalk|fashion|outfit|streetwear|celebrit|portrait|red carpet)'
      and e.title !~* '(cancer|tumou?r|illness|diagnos|surgery|hysterectomy|hospital|died|dies|death|dead|funeral|passed away|grief|miscarriage|pregnan|divorce|arrest|charged|lawsuit|sued|assault|abuse|rehab|overdose|suicide)'
    order by e.importance desc, e.last_article_at desc limit ${limit}`;
  let n = 0;
  for (const e of events) {
    if (exhausted.size === PROVIDERS.length) break;
    const pool = e.slugs?.flatMap((s) => TOPIC_QUERIES[s] ?? []) ?? [];
    // only the story's own scene; a generic topic photo is worse than our designed cover
    void pool;
    const queries = [e.image_query].filter((q) => q && q !== "-") as string[];
    if (!queries.length) { await sql`update events set image_checked_at = now() where id = ${e.id}`; continue; }
    const img = await find(queries, !!e.image_query);
    if (!img && exhausted.size === PROVIDERS.length) break;   // try again next run
    await sql`update events set image_checked_at = now(), image_url = coalesce(image_url, ${img?.url ?? null}),
              image_credit = coalesce(image_credit, ${img?.credit ?? null}), image_link = coalesce(image_link, ${img?.link ?? null}),
              image_source = coalesce(image_source, ${img?.source ?? null}), image_license = coalesce(image_license, ${img?.license ?? null}),
              image_license_url = coalesce(image_license_url, ${img?.licenseUrl ?? null}), image_fetched_at = case when ${!!img} then now() else image_fetched_at end
              where id = ${e.id}`;
    if (img) n++;
  }
  // a picture the editor rejected never comes back: drop it again and leave the designed cover
  await sql`update events set image_url = null, image_credit = null, image_link = null, image_source = null, image_license = null, image_focus = null,
            image_checked_at = now(), brand_checked_at = now(), press_checked_at = now(), person_checked_at = now(), game_checked_at = now()
            where image_url is not null and image_url = any(image_blocked)`;
  if (events.length) log(`images: ${n}/${events.length}`);
  return n;
}

/** Portrait scenic photo for an Instagram travel post (never stored on the event, so the site's image rules are untouched). */
export async function travelPhoto(q: string): Promise<{ url: string; credit: string } | null> {
  const key = env("PEXELS_API_KEY"); if (!key || !q || q === "-") return null;
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=15`, { headers: { Authorization: key }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) return null;
  // deno-lint-ignore no-explicit-any
  const ps = ((await r.json()).photos ?? []).filter((p: any) => relevant(q, `${p.alt ?? ""} ${p.url ?? ""}`));
  const p = ps[0];
  if (!p) return null;
  return { url: `${String(p.src.original).split("?")[0]}?auto=compress&cs=tinysrgb&fit=crop&w=1080&h=1350`, credit: `${p.photographer} / Pexels` };
}
