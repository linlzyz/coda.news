// Company profiles (CEO is not shown: Wikidata often lags behind leadership changes).
// Company profiles: facts from Wikidata (CC0) and a short summary from Wikipedia (CC BY-SA, credited on the page).
// A match must look like an organisation (industry, stock listing, CEO, etc.) and its name must fit, otherwise nothing is stored.
import { db } from "./db.ts";
import { log } from "./env.ts";

const UA = { "user-agent": "CodaNewsBot/0.1 (https://coda.news; hello@coda.news)" };
const WD = "https://www.wikidata.org/w/api.php?format=json&";
// deno-lint-ignore no-explicit-any
type Ent = any;
const get = async (q: string) => {
  const r = await fetch(WD + q, { headers: UA, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`wikidata ${r.status}`);
  return r.json();
};
const ORG = /\b(company|corporation|business|manufacturer|firm|brand|bank|startup|conglomerate|retailer|airline|maker|carrier|developer|operator|holding|enterprise|chain|publisher|studio|record label|exchange|insurer|automaker|producer|provider|platform|club|franchise|team|league|organi[sz]ation|agency|regulator|central bank|fund|group)\b/i;
const HARD = ["P414", "P452", "P1128", "P2139", "P169", "P1454", "P118"];
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
// corporate words that may follow a short name ("Toyota" = "Toyota Motor Corporation"); anything else (e.g. "Kodak Japan") is a different entity
const SUFFIX = new Set("inc incorporated corp corporation co company companies ltd limited plc llc ag sa se nv bv gmbh kk group holdings holding motor motors energy technologies technology international global platforms".split(" "));
const fit = (name: string, e: Ent): number => {
  const n = norm(name);
  const names = [e.labels?.en?.value, ...(e.aliases?.en ?? []).map((a: Ent) => a.value)].filter(Boolean).map((x: string) => norm(x));
  if (names.includes(n)) return 3;
  const ext = (long: string, short: string) => long.startsWith(short + " ") && long.slice(short.length + 1).split(" ").every((w) => SUFFIX.has(w));
  if (names.some((x: string) => ext(x, n) || ext(n, x))) return 2;
  return names.some((x: string) => x.length > 2 && n.endsWith(" " + x)) ? 1 : 0;   // "Eastman Kodak" vs "Kodak": only for major, listed entities
};
const hard = (e: Ent) => HARD.some((p) => e.claims?.[p]);
// minor entities (no English Wikipedia page) need an exact name; loose matches need a listed company with a Wikipedia page
// only entities with an English Wikipedia page, so an obscure namesake (e.g. a Czech "SF Holding") never wins
const ok = (name: string, e: Ent) => { const f = fit(name, e); return !!e.sitelinks?.enwiki && (f >= 2 || (f === 1 && hard(e))); };
const zhOf = (o: Ent) => (o?.["zh-hans"] ?? o?.["zh-cn"] ?? o?.zh)?.value as string | undefined;
const claim = (e: Ent, p: string) => {
  const cs = (e.claims?.[p] ?? []) as Ent[];
  return cs.find((c) => c.rank === "preferred") ?? cs.find((c) => c.rank === "normal");
};
const idOf = (e: Ent, p: string) => claim(e, p)?.mainsnak?.datavalue?.value?.id as string | undefined;

async function pick(name: string): Promise<Ent | null> {
  const s = await get(`action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=7`);
  let ids: string[] = (s.search ?? []).map((x: Ent) => x.id);
  const load = async (ids: string[]) => ids.length
    ? Object.values((await get(`action=wbgetentities&ids=${ids.join("|")}&props=labels|aliases|descriptions|claims|sitelinks&languages=en|zh|zh-hans|zh-cn&sitefilter=enwiki|zhwiki`)).entities ?? {}) as Ent[]
    : [];
  const choose = (ents: Ent[]) => ents
    .filter((e) => ok(name, e) && (hard(e) || (ORG.test(e.descriptions?.en?.value ?? "") && e.claims?.P856)))
    .map((e) => ({ e, s: fit(name, e) + (HARD.some((p) => e.claims?.[p]) ? 2 : 0) + (e.sitelinks?.enwiki ? 2 : 0) + (e.claims?.P856 ? 1 : 0) }))
    .sort((a, b) => b.s - a.s)[0]?.e ?? null;
  let best = choose(await load(ids));
  if (!best) {   // e.g. "Woodside" is mostly places; search only items that have an industry or a stock listing
    const f = await get(`action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(`${name} haswbstatement:P452|P414`)}`);
    ids = (f.query?.search ?? []).map((x: Ent) => x.title);
    best = choose(await load(ids));
  }
  return best;
}

async function wikiSummary(lang: "en" | "zh", title?: string) {
  if (!title) return null;
  const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    { headers: { ...UA, ...(lang === "zh" ? { "accept-language": "zh-hans" } : {}) }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) return null;
  const j = await r.json();
  if (j.type !== "standard") return null;
  const t = String(j.extract ?? "").replace(/\s+/g, " ").trim();
  // keep the first 2 to 3 sentences
  // sentence ends: CJK punctuation, or ". " followed by a capital (so "Co., Ltd" and "U.S." stay intact)
  const max = lang === "zh" ? 160 : 420;
  const re = lang === "zh" ? /[。！？]/g : /[.!?](?=\s+[A-Z"“(]|$)/g;
  let end = 0;
  for (const m of t.matchAll(re)) { const i = (m.index ?? 0) + 1; if (i > max) break; end = i; }
  return (end ? t.slice(0, end) : t.length <= max ? t : "").trim() || null;
}

export async function enrichCompanies(limit = 15): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; name: string }[]>`select id, name from companies where enriched_at is null order by id limit ${limit}`;
  let n = 0;
  for (const c of rows) {
    try {
      const e = await pick(c.name);
      if (!e) { await sql`update companies set enriched_at = now() where id = ${c.id}`; continue; }
      const refs = [idOf(e, "P159"), idOf(e, "P452"), idOf(e, "P414"), idOf(e, "P17")].filter(Boolean) as string[];
      const labels = refs.length ? (await get(`action=wbgetentities&ids=${[...new Set(refs)].join("|")}&props=labels|claims&languages=en|zh|zh-hans|zh-cn`)).entities ?? {} : {};
      const en = (id?: string) => (id ? labels[id]?.labels?.en?.value : undefined) as string | undefined;
      const zh = (id?: string) => (id ? zhOf(labels[id]?.labels) : undefined);
      const hqId = idOf(e, "P159"), countryId = idOf(e, "P17"), indId = idOf(e, "P452");
      // show the HQ city only when it is a real settlement (has a population); buildings, airports and districts fall back to the country
      const city = hqId && labels[hqId]?.claims?.P1082 && hqId !== countryId ? hqId : undefined;
      const hq = [en(city), en(countryId)].filter(Boolean).join(", ") || null;
      const hqZh = [zh(countryId), zh(city)].filter(Boolean).join(" ") || null;
      const listing = claim(e, "P414");
      const sym = listing?.qualifiers?.P249?.[0]?.datavalue?.value as string | undefined;
      const exch = en(listing?.mainsnak?.datavalue?.value?.id)?.replace(/^New York Stock Exchange$/, "NYSE").replace(/^Nasdaq.*$/i, "NASDAQ");
      const founded = String(claim(e, "P571")?.mainsnak?.datavalue?.value?.time ?? "").match(/^\+(\d{3,4})-/)?.[1];
      // website: preferred rank, else the shortest English one, else the shortest; never deprecated
      const sites = ((e.claims?.P856 ?? []) as Ent[]).filter((c) => c.rank !== "deprecated" && typeof c.mainsnak?.datavalue?.value === "string");
      const url = (c: Ent) => c.mainsnak.datavalue.value as string;
      const shortest = (cs: Ent[]) => cs.sort((a, b) => url(a).length - url(b).length)[0];
      const english = sites.filter((c) => (c.qualifiers?.P407 ?? []).some((q: Ent) => q.datavalue?.value?.id === "Q1860"));
      const siteC = sites.find((c) => c.rank === "preferred") ?? shortest(english) ?? shortest(sites);
      const site = siteC ? url(siteC) : null;
      const enT = e.sitelinks?.enwiki?.title as string | undefined, zhT = e.sitelinks?.zhwiki?.title as string | undefined;
      const [aboutEn, aboutZh] = await Promise.all([wikiSummary("en", enT), wikiSummary("zh", zhT)]);
      await sql`update companies set wikidata_id = ${e.id}, name_zh = ${zhOf(e.labels) ?? null},
        description = coalesce(description, ${e.descriptions?.en?.value ?? null}), description_zh = ${zhOf(e.descriptions) ?? null},
        about_en = ${aboutEn}, about_zh = ${aboutZh}, website = coalesce(website, ${site}), founded = ${founded ? Number(founded) : null},
        hq = ${hq}, hq_zh = ${hqZh}, industry = ${en(indId) ?? null}, industry_zh = ${zh(indId) ?? null}, ceo = null,
        ticker = ${sym ? (exch ? `${exch}: ${sym}` : sym) : null},
        wikipedia_en = ${enT ? `https://en.wikipedia.org/wiki/${encodeURIComponent(enT.replace(/ /g, "_"))}` : null},
        wikipedia_zh = ${zhT ? `https://zh.wikipedia.org/wiki/${encodeURIComponent(zhT.replace(/ /g, "_"))}` : null},
        enriched_at = now() where id = ${c.id}`;
      n++;
    } catch (err) { log("companies:", c.name, (err as Error).message); break; }   // network trouble: try again next run
  }
  if (rows.length) log(`companies: ${n}/${rows.length}`);
  return n;
}
