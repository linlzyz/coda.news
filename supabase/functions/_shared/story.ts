// Company profiles for notable companies: origin, turning points, people and a cover photo, written once from Wikipedia
// (our own words, EN + ZH) and refreshed every few months. Only facts from the Wikipedia text; nothing invented.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { cheapJSON, generateJSON } from "./ai.ts";
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


// leadership from Wikidata: current CEO, the previous CEO (with years) and the current chair
async function leaders(qid: string): Promise<{ name: string; role: string; role_zh: string }[]> {
  const get = async (q: string) => (await fetch(`https://www.wikidata.org/w/api.php?format=json&${q}`, { headers: UA, signal: AbortSignal.timeout(10000) })).json();
  const c = await get(`action=wbgetclaims&entity=${qid}`);
  const yr = (x: any, p: string) => Number(String(x.qualifiers?.[p]?.[0]?.datavalue?.value?.time ?? "").slice(1, 5)) || null;
  const list = (p: string) => ((c.claims?.[p] ?? []) as any[]).filter((x) => x.rank !== "deprecated" && x.mainsnak?.datavalue?.value?.id)
    .map((x) => ({ id: x.mainsnak.datavalue.value.id as string, from: yr(x, "P580"), to: yr(x, "P582") }));
  const ceos = list("P169"), chairs = list("P488");
  const now = ceos.filter((x) => !x.to).sort((a, b) => (b.from ?? 0) - (a.from ?? 0))[0];
  const prev = ceos.filter((x) => x.to).sort((a, b) => (b.to ?? 0) - (a.to ?? 0))[0];
  const chair = chairs.filter((x) => !x.to)[0];
  const ids = [now?.id, prev?.id, chair?.id].filter(Boolean) as string[];
  if (!ids.length) return [];
  const e = (await get(`action=wbgetentities&ids=${[...new Set(ids)].join("|")}&props=labels&languages=en|mul`)).entities ?? {};
  const label = (id: string) => (e[id]?.labels?.en ?? e[id]?.labels?.mul)?.value as string | undefined;
  const out: { name: string; role: string; role_zh: string }[] = [];
  if (now && label(now.id)) out.push({ name: label(now.id)!, role: now.from ? `CEO since ${now.from}` : "CEO", role_zh: now.from ? `首席执行官（${now.from} 年起）` : "首席执行官" });
  if (prev && label(prev.id)) out.push({ name: label(prev.id)!, role: `CEO ${prev.from ?? ""}–${prev.to}`, role_zh: `前首席执行官（${prev.from ?? ""}–${prev.to}）` });
  if (chair && label(chair.id)) out.push({ name: label(chair.id)!, role: "Chair", role_zh: "董事长" });
  return out;
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
"turning":[{"year":1976,"text":"one short sentence","text_zh":"same in Chinese"}] (5 or 6 moments a general reader would recognise as the most important: founding, the launch of its most famous products, big acquisitions or mergers, major leadership changes; in order, spread across its history up to recent years; every item must have year, text AND text_zh. Prefer the launch of flagship products and turning-point deals over paperwork such as incorporation or renaming),
"products":["up to 6 best-known products, brands or services"]}

In the Chinese, use the usual Chinese names for well-known people, companies and places (e.g. 乔布斯, 苹果, 库比蒂诺); product names stay as they are (iPhone).

Wikipedia text:
${text}`, "smart");
      if (!s?.origin?.length || !s.turning?.length) continue;
      // fill any Chinese the model left out
      if (!s.origin_zh?.length || s.turning.some((t) => !t.text_zh) || !s.tagline_zh) {
        const tr = await cheapJSON<{ tagline_zh?: string; origin_zh?: string[]; turning_zh?: string[] }>(`Translate into natural Simplified Chinese (usual Chinese names for well-known people, companies and places; product names unchanged). Return JSON only: {"tagline_zh":"...","origin_zh":["..."],"turning_zh":["one per item, same order"]}
tagline: ${s.tagline}
origin: ${JSON.stringify(s.origin)}
turning: ${JSON.stringify(s.turning.map((t) => t.text))}`);
        s.tagline_zh ||= tr.tagline_zh ?? "";
        if (!s.origin_zh?.length) s.origin_zh = tr.origin_zh ?? [];
        s.turning = s.turning.map((t, i) => ({ ...t, text_zh: t.text_zh || tr.turning_zh?.[i] || "" }));
      }
      const cover = await coverPhoto(c.wikidata_id).catch(() => null);
      const people: { name: string; role: string; role_zh: string; photo?: string; credit?: string }[] = [];
      const lead = await leaders(c.wikidata_id).catch(() => []);
      const add = (name: string, role: string, roleZh: string) => {
        const p = people.find((x) => x.name === name);
        if (p) { p.role += " · " + role; p.role_zh += " · " + roleZh; } else people.push({ name, role, role_zh: roleZh });
      };
      for (const x of lead) add(x.name, x.role, x.role_zh);
      if (!lead.length && c.ceo) add(c.ceo, "CEO", "首席执行官");
      for (const f of (c.founders ?? "").split(/,\s*/).filter(Boolean).slice(0, 3)) add(f, "Founder", "创始人");
      for (const p of people.slice(0, 6)) { const img = await personPhoto(p.name, 0).catch(() => null); if (img) { p.photo = img.url; p.credit = img.credit; } }
      await sql`update companies set story = ${sql.json({ ...s, turning: s.turning.filter((t) => t.year && t.text).slice(0, 6), cover, people: people.slice(0, 6) })}, story_at = now() where id = ${c.id}`;
      n++;
    } catch (e) { log("story:", c.name, (e as Error).message.slice(0, 100)); }
  }
  if (rows.length) log(`stories: ${n}/${rows.length}`);
  return n;
}
