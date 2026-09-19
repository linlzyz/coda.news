// Company profiles for notable companies: origin, turning points, people and a cover photo, written once from Wikipedia
// (our own words, EN + ZH) and refreshed every few months. Only facts from the Wikipedia text; nothing invented.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { generateJSON } from "./ai.ts";
import { personPhoto } from "./images.ts";

const UA = { "user-agent": "CodaNewsBot/0.1 (https://coda.news; info@coda.news)" };
const FREE = /^(public domain|cc0|cc by(-sa)? \d|cc by(-sa)?$|pdm)/i;

async function wikiText(title: string): Promise<string> {
  const u = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}`;
  const j = await (await fetch(u, { headers: UA, signal: AbortSignal.timeout(12000) })).json();
  const page = Object.values(j.query?.pages ?? {})[0] as { extract?: string } | undefined;
  // intro + history are what we need; cut before the long lists at the end
  return (page?.extract ?? "").split(/\n== (See also|References|External links|Notes|Further reading) ==/)[0].slice(0, 14000);
}

// the company's own main image on Wikidata (headquarters, flagship store...), landscape and free only
async function coverPhoto(qid: string) {
  const c = await (await fetch(`https://www.wikidata.org/w/api.php?format=json&action=wbgetclaims&entity=${qid}&property=P18`, { headers: UA, signal: AbortSignal.timeout(8000) })).json();
  const file = c.claims?.P18?.[0]?.mainsnak?.datavalue?.value as string | undefined;
  if (!file) return null;
  const ii = await (await fetch(`https://commons.wikimedia.org/w/api.php?format=json&action=query&titles=${encodeURIComponent("File:" + file)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600`, { headers: UA, signal: AbortSignal.timeout(10000) })).json();
  const i = (Object.values(ii.query?.pages ?? {})[0] as { imageinfo?: any[] })?.imageinfo?.[0];
  const lic = String(i?.extmetadata?.LicenseShortName?.value ?? "");
  if (!i || !/^image\/jpe?g$/.test(i.mime) || i.width < 1000 || i.width < i.height || !FREE.test(lic)) return null;
  const artist = String(i.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 60) || "Unknown";
  return { url: i.thumburl ?? i.url, credit: `${artist} / Wikimedia Commons (${lic})`, link: i.descriptionurl };
}

interface Story {
  tagline: string; tagline_zh: string; origin: string[]; origin_zh: string[];
  turning: { year: number; text: string; text_zh: string }[]; products?: string[];
}

export async function buildStories(limit = 3, slug?: string): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; name: string; wikidata_id: string; wikipedia_en: string; ceo: string | null; founders: string | null }[]>`
    select c.id, c.name, c.wikidata_id, c.wikipedia_en, c.ceo, c.founders from companies c
    where c.wikidata_id is not null and c.wikipedia_en is not null and ${slug ? sql`c.slug = ${slug}` : sql`(c.story_at is null or c.story_at < now() - interval '90 days')
      and (select count(*) from events e where c.id = any(e.company_ids)) >= 2`}
    order by (select count(*) from events e where c.id = any(e.company_ids)) desc limit ${limit}`;
  let n = 0;
  for (const c of rows) {
    try {
      const title = decodeURIComponent(c.wikipedia_en.split("/wiki/")[1] ?? "").replace(/_/g, " ");
      const text = await wikiText(title);
      if (text.length < 800) { await sql`update companies set story_at = now() where id = ${c.id}`; continue; }
      const s = await generateJSON<Story>(`Write a short company profile of ${c.name} for coda.news, using ONLY facts in the Wikipedia text below. Your own words, plain and factual, no hype, no opinions, no controversies.
Return JSON only:
{"tagline":"one short line on what the company is known for (max 10 words)","tagline_zh":"same in Simplified Chinese",
"origin":["2 short paragraphs. 1: how, when and where it started and who founded it. 2: how it grew into what it is today, naming its defining products or moves and its size today if the text gives it. Concrete, no vague filler."],"origin_zh":["the same 2 paragraphs in natural Simplified Chinese"],
"turning":[{"year":1976,"text":"one short sentence","text_zh":"same in Chinese"}] (5 or 6 moments a general reader would recognise as the most important: founding, breakthrough products, big acquisitions, leadership changes; in order, spread across its history up to recent years),
"products":["up to 6 best-known products, brands or services"]}

In the Chinese, use the usual Chinese names for well-known people, companies and places (e.g. 乔布斯, 苹果, 库比蒂诺); product names stay as they are (iPhone).

Wikipedia text:
${text}`, "smart");
      if (!s?.origin?.length || !s.turning?.length) continue;
      const cover = await coverPhoto(c.wikidata_id).catch(() => null);
      const people: { name: string; role: string; role_zh: string; photo?: string; credit?: string }[] = [];
      const seen = new Set<string>();
      for (const [names, role, roleZh] of [[c.ceo, "CEO", "首席执行官"], [c.founders, "Founder", "创始人"]] as const) {
        for (const name of (names ?? "").split(/,\s*/).filter(Boolean).slice(0, 3)) {
          if (seen.has(name)) { const p = people.find((x) => x.name === name); if (p) { p.role += " & " + role; p.role_zh += "、" + roleZh; } continue; }
          seen.add(name);
          const img = await personPhoto(name, 0).catch(() => null);
          people.push({ name, role, role_zh: roleZh, photo: img?.url, credit: img?.credit });
        }
      }
      await sql`update companies set story = ${sql.json({ ...s, turning: s.turning.filter((t) => t.year && t.text).slice(0, 6), cover, people: people.slice(0, 4) })}, story_at = now() where id = ${c.id}`;
      n++;
    } catch (e) { log("story:", c.name, (e as Error).message.slice(0, 100)); }
  }
  if (rows.length) log(`stories: ${n}/${rows.length}`);
  return n;
}
