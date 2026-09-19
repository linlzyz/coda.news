// Company profiles (CEO is not shown: Wikidata often lags behind leadership changes).
// Company profiles: facts from Wikidata (CC0) and a short summary from Wikipedia (CC BY-SA, credited on the page).
// A match must look like an organisation (industry, stock listing, CEO, etc.) and its name must fit, otherwise nothing is stored.
import { db } from "./db.ts";
import { log } from "./env.ts";

const UA = { "user-agent": "CodaNewsBot/0.1 (https://coda.news; info@coda.news)" };
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
// our sector tags, matched against the Wikidata industry, the description and the parent company (first match wins)
const SECTORS: [string, RegExp][] = [
  ["institution", /central bank|regulat|government agency|ministry|authority|commission|intergovernmental|supranational|statistics office|monetary/i],
  ["luxury", /luxury|haute couture|jewel|watchmak|lvmh|kering|richemont/i],
  ["beauty", /cosmetic|beauty|fragrance|perfume|skin ?care|make-?up/i],
  ["fashion", /fashion|clothing|apparel|footwear|textile|sportswear|garment|designer/i],
  ["automotive", /automotive|automobile|car manufacturer|motor vehicle|electric vehicle|motorcycle|truck/i],
  ["sport", /sport|football club|franchise|league|association football|athletic|racing team/i],
  ["entertainment", /film (studio|production|distribution|industry)|motion picture|music|record label|television|broadcast|mass media|entertainment|video game|publishing|streaming|newspaper|copyright|collecting society/i],
  ["finance", /bank|financ|insurance|investment|asset management|fintech|payment|brokerage|stock exchange|holding company|private equity|venture capital/i],
  ["energy", /petroleum|oil|natural gas|energy|electric utility|mining|coal|solar|nuclear|power generation/i],
  ["technology", /software|internet|semiconductor|electronic|computer|technology|telecommunication|artificial intelligence|information technology|cloud|robot|camera|photograph|imaging|optic/i],
  ["retail", /retail|supermarket|e-?commerce|food|beverage|restaurant|consumer goods|furniture|department store|grocery|brewery|tobacco/i],
  ["industrial", /manufactur|construction|engineering|aerospace|shipbuild|chemical|steel|logistics|transport|airline|shipping|railway|conglomerate|real estate|pharmaceutical|biotech/i],
];
export const sectorOf = (...texts: (string | undefined | null)[]) => { const t = texts.filter(Boolean).join(" | "); return SECTORS.find(([, re]) => re.test(t))?.[0] ?? null; };
// social accounts: only when unambiguous (a preferred value, or a single value); big brands list many regional accounts
const handle = (e: Ent, p: string) => {
  const cs = ((e.claims?.[p] ?? []) as Ent[]).filter((c) => c.rank !== "deprecated");
  const c = cs.find((x) => x.rank === "preferred") ?? (cs.length === 1 ? cs[0] : undefined);
  return (c?.mainsnak?.datavalue?.value as string | undefined) ?? null;
};
const single = (e: Ent, p: string) => (claim(e, p)?.mainsnak?.datavalue?.value as string | undefined) ?? null;

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
  // most-covered companies first
  const rows = await sql<{ id: number; name: string }[]>`select c.id, c.name from companies c left join company_stats s on s.company_id = c.id where c.enriched_at is null
    order by exists (select 1 from events e where lower(e.image_brand) = lower(c.name)) desc, s.events desc nulls last, c.id limit ${limit}`;   // brands waiting for a logo first
  let n = 0;
  for (const c of rows) {
    try {
      const e = await pick(c.name);
      if (!e) { await sql`update companies set enriched_at = now() where id = ${c.id}`; continue; }
      // founders (up to 3) and the current CEO: only a CEO claim with no end date, the most recent start first
      const founderIds = ((e.claims?.P112 ?? []) as Ent[]).filter((c) => c.rank !== "deprecated").map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0, 3) as string[];
      const ceoC = ((e.claims?.P169 ?? []) as Ent[]).filter((c) => c.rank !== "deprecated" && !c.qualifiers?.P582)
        .sort((a, b) => (b.rank === "preferred" ? 1 : 0) - (a.rank === "preferred" ? 1 : 0) || String(b.qualifiers?.P580?.[0]?.datavalue?.value?.time ?? "").localeCompare(String(a.qualifiers?.P580?.[0]?.datavalue?.value?.time ?? "")))[0];
      const ceoId = ceoC?.mainsnak?.datavalue?.value?.id as string | undefined;
      const refs = [idOf(e, "P159"), idOf(e, "P452"), idOf(e, "P414"), idOf(e, "P17"), idOf(e, "P749"), ...founderIds, ceoId].filter(Boolean) as string[];
      const labels = refs.length ? (await get(`action=wbgetentities&ids=${[...new Set(refs)].join("|")}&props=labels|claims&languages=en|mul|zh|zh-hans|zh-cn`)).entities ?? {} : {};
      const en = (id?: string) => (id ? (labels[id]?.labels?.en ?? labels[id]?.labels?.mul)?.value : undefined) as string | undefined;
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
      // logo: Commons only hosts freely licensed files (non-free logos live on Wikipedia, not Commons), so any P154 file is usable
      const logoFile = single(e, "P154");
      const logo = logoFile ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(logoFile.replace(/ /g, "_"))}?width=320` : null;
      // slogan: current ones only (skip any with an end date, e.g. Google's old "Don't be evil"); preferred rank first, English first
      const slogans = ((e.claims?.P1451 ?? []) as Ent[]).filter((c) => c.rank !== "deprecated" && !c.qualifiers?.P582);
      const pickS = slogans.find((c) => c.rank === "preferred") ?? slogans.find((c) => c.mainsnak?.datavalue?.value?.language === "en") ?? slogans[0];
      const sloganC = pickS?.mainsnak?.datavalue?.value;
      const parentId = idOf(e, "P749");
      const sector = sectorOf(en(indId), e.descriptions?.en?.value, en(parentId));
      // the same entity already exists under another name (e.g. "Meta" and "Meta Platforms"): fold this one into it
      const first = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]+/)?.[0] ?? "";
      const [twin] = await sql<{ id: number; name: string }[]>`select id, name from companies where wikidata_id = ${e.id} and id <> ${c.id} limit 1`;
      if (twin && first(twin.name) === first(c.name)) { await sql`select merge_companies(${twin.id}, ${c.id})`; log("companies: merged", c.name, "into", twin.name); n++; continue; }
      // a different company already owns this entity (e.g. Douyin matched ByteDance's entry): leave this one unenriched, never a second copy
      if (twin) { await sql`update companies set enriched_at = now() where id = ${c.id}`; log("companies: skipped", c.name, "(entity belongs to", twin.name + ")"); n++; continue; }
      await sql`update companies set wikidata_id = ${e.id}, name_zh = ${zhOf(e.labels) ?? null},
        description = coalesce(description, ${e.descriptions?.en?.value ?? null}), description_zh = ${zhOf(e.descriptions) ?? null},
        about_en = ${aboutEn}, about_zh = ${aboutZh}, website = coalesce(website, ${site}), founded = ${founded ? Number(founded) : null},
        hq = ${hq}, hq_zh = ${hqZh}, industry = ${en(indId) ?? null}, industry_zh = ${zh(indId) ?? null}, ceo = ${ceoId ? en(ceoId) ?? null : null}, ceo_zh = ${ceoId ? zh(ceoId) ?? null : null},
        founders = ${founderIds.map((id) => en(id)).filter(Boolean).join(", ") || null}, founders_zh = ${founderIds.map((id) => zh(id) ?? en(id)).filter(Boolean).join("、") || null},
        ticker = ${sym ? (exch ? `${exch}: ${sym}` : sym) : null},
        wikipedia_en = ${enT ? `https://en.wikipedia.org/wiki/${encodeURIComponent(enT.replace(/ /g, "_"))}` : null},
        wikipedia_zh = ${zhT ? `https://zh.wikipedia.org/wiki/${encodeURIComponent(zhT.replace(/ /g, "_"))}` : null},
        logo_url = ${logo}, slogan = ${sloganC?.text ? String(sloganC.text).slice(0, 160) : null},
        parent = ${en(parentId) ?? null}, parent_zh = ${zh(parentId) ?? null},
        instagram = ${handle(e, "P2003")}, x_handle = ${handle(e, "P2002")}, facebook = ${handle(e, "P2013")}, youtube = ${handle(e, "P2397")}, linkedin = ${handle(e, "P4264")},
        sector = ${sector}, country = ${(labels[countryId ?? ""]?.claims?.P297?.[0]?.mainsnak?.datavalue?.value as string | undefined) ?? null},
        enriched_at = now() where id = ${c.id}`;
      n++;
    } catch (err) { log("companies:", c.name, (err as Error).message); break; }   // network trouble: try again next run
  }
  // companies without a Wikidata match (or no clear sector): use the section their news appears in most
  await sql`update companies c set sector = x.s from (
      select c2.id, (select case e.category when 'technology' then 'technology' when 'sport' then 'sport' when 'entertainment' then 'entertainment'
                              when 'fashion' then 'fashion' else 'other' end
                     from events e where c2.id = any(e.company_ids) group by e.category order by count(*) desc limit 1) as s
      from companies c2 where c2.sector is null and c2.enriched_at is not null) x
    where c.id = x.id and x.s is not null`;
  if (rows.length) log(`companies: ${n}/${rows.length}`);
  return n;
}
