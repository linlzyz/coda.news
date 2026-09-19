import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Public, read-only client. Row Level Security only allows reading published knowledge.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

export type Status = "rumor" | "breaking" | "developing" | "confirmed" | "resolved" | "archived";
export interface EventRow {
  id: number; slug: string; title: string; title_zh: string | null; category: string; status: Status; regions?: string[]; image_focus?: string | null; lead_url?: string | null; lead_source?: string | null;
  confidence: number; importance: number; summary: string | null; summary_zh: string | null; countries: string[]; source_count: number;
  article_count: number; has_official: boolean; image_url: string | null; image_credit: string | null; image_link: string | null; company_ids: number[]; topic_ids: number[];
  started_at: string; last_article_at: string; summary_version: number;
}
export interface Perspective { country: string; headline: string | null; framing: string | null; emphasis: string | null; downplayed: string | null; tone: "positive" | "neutral" | "negative"; article_count: number; headline_zh: string | null; framing_zh: string | null; emphasis_zh: string | null; downplayed_zh: string | null }
export interface Topic { id: number; name: string; slug: string; color: string }
export interface Company { id: number; name: string; slug: string }

const EVENT_COLS = "id,slug,title,title_zh,category,status,confidence,importance,summary,summary_zh,countries,source_count,article_count,has_official,image_url,image_credit,image_link,company_ids,topic_ids,started_at,last_article_at,summary_version,regions,image_focus,lead_url,lead_source";

async function _listEvents(opts: { category?: string; region?: string; companyId?: number; topicId?: number; limit?: number; order?: "importance" | "recent" } = {}) {
  let q = supabase.from("events").select(EVENT_COLS).not("summary", "is", null).neq("status", "archived");
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.region) q = q.contains("regions", [opts.region]);
  if (opts.companyId) q = q.contains("company_ids", [opts.companyId]);
  if (opts.topicId) q = q.contains("topic_ids", [opts.topicId]);
  q = opts.order === "recent" ? q.order("last_article_at", { ascending: false }) : q.order("importance", { ascending: false }).order("last_article_at", { ascending: false });
  const { data, error } = await q.limit((opts.limit ?? 30) + (opts.region ? 40 : 0));
  if (error) throw error;
  // a region tab only shows stories mainly about that country, not multi-nation ones (e.g. an Asian Games match)
  const rows = (data ?? []) as EventRow[];
  return opts.region ? rows.filter((e) => (e.regions?.length ?? 0) <= 2).slice(0, opts.limit ?? 30) : rows;
}

async function _getEvent(slug: string) {
  const { data } = await supabase.from("events").select(EVENT_COLS).eq("slug", slug).maybeSingle();
  return data as EventRow | null;
}

async function _perspectiveRows(eventIds: number[]) {
  if (!eventIds.length) return [] as (Perspective & { event_id: number })[];
  const { data } = await supabase.from("perspectives").select("event_id,country,headline,framing,emphasis,downplayed,tone,article_count,headline_zh,framing_zh,emphasis_zh,downplayed_zh").in("event_id", eventIds);
  return (data ?? []) as (Perspective & { event_id: number })[];
}
const perspectiveRows = unstable_cache(_perspectiveRows, ["perspectiveRows"], { revalidate: 60 });
export async function getPerspectives(eventIds: number[]) {
  const m = new Map<number, Perspective[]>();
  for (const p of await perspectiveRows(eventIds)) m.set(p.event_id, [...(m.get(p.event_id) ?? []), p]);
  for (const list of m.values()) list.sort((a, b) => b.article_count - a.article_count);
  return m;
}

async function _getLatestSummary(eventId: number) {
  const { data } = await supabase.from("event_updates").select("content,version,created_at").eq("event_id", eventId).eq("type", "summary_updated")
    .order("version", { ascending: false }).limit(1).maybeSingle();
  return data ? { ...(data.content as { agreed?: string[]; agreed_zh?: string[]; analysis?: string; analysis_zh?: string }), created_at: data.created_at as string } : undefined;
}

async function _getFacts(eventId: number) {
  const { data } = await supabase.from("event_updates").select("id,content,source_ids,occurred_at").eq("event_id", eventId).eq("type", "fact")
    .order("occurred_at", { ascending: false }).limit(40);
  return (data ?? []) as { id: number; content: { text: string; text_zh?: string; subject: string; predicate: string; object: string }; source_ids: number[]; occurred_at: string }[];
}

async function _getArticles(eventId: number) {
  const { data } = await supabase.from("articles").select("id,url,title,headline_en,published_at,sources(name,country,type)").eq("event_id", eventId)
    .order("published_at", { ascending: false }).limit(80);
  return (data ?? []) as unknown as { id: number; url: string; title: string; headline_en: string | null; published_at: string; sources: { name: string; country: string; type: string } }[];
}

async function _latestUpdates(limit = 14) {
  const { data } = await supabase.from("event_updates").select("id,type,content,created_at,events!inner(slug,title,title_zh,status)")
    .eq("type", "fact").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as unknown as { id: number; content: { text: string }; created_at: string; events: { slug: string; title: string; title_zh: string | null; status: Status } }[];
}

async function _allTopics() {
  const { data } = await supabase.from("topics").select("id,name,slug,color").order("id");
  return (data ?? []) as Topic[];
}
async function _companiesByIds(ids: number[]) {
  if (!ids.length) return [] as Company[];
  const { data } = await supabase.from("companies").select("id,name,slug").in("id", ids);
  return (data ?? []) as Company[];
}
export type CompanyProfile = Company & {
  website: string | null; description: string | null; wikidata_id: string | null; name_zh: string | null; description_zh: string | null;
  about_en: string | null; about_zh: string | null; founded: number | null; hq: string | null; hq_zh: string | null;
  industry: string | null; industry_zh: string | null; ticker: string | null; wikipedia_en: string | null; wikipedia_zh: string | null;
  logo_url: string | null; slogan: string | null; parent: string | null; parent_zh: string | null; sector: string | null; country: string | null;
  instagram: string | null; x_handle: string | null; facebook: string | null; youtube: string | null; linkedin: string | null;
  founders: string | null; founders_zh: string | null; ceo: string | null; ceo_zh: string | null;
  story?: CompanyStory | null;
};
export type CompanyStory = {
  tagline: string; tagline_zh: string; origin: string[]; origin_zh: string[]; products?: string[];
  turning: { year: number; text: string; text_zh: string }[];
  cover?: { url: string; credit: string; link: string } | null;
  people?: { name: string; role: string; role_zh: string; photo?: string; credit?: string }[];
};
async function _getCompany(slug: string) {
  const { data } = await supabase.from("companies")
    .select("id,name,slug,website,description,wikidata_id,name_zh,description_zh,about_en,about_zh,founded,hq,hq_zh,industry,industry_zh,ticker,wikipedia_en,wikipedia_zh,logo_url,slogan,parent,parent_zh,sector,country,instagram,x_handle,facebook,youtube,linkedin,founders,founders_zh,ceo,ceo_zh,story")
    .eq("slug", slug).maybeSingle();
  return data as CompanyProfile | null;
}
export async function companyRedirect(slug: string): Promise<string | null> {
  const { data } = await supabase.from("company_redirects").select("companies(slug)").eq("slug", slug).maybeSingle();
  return (data as { companies: { slug: string } | null } | null)?.companies?.slug ?? null;
}
async function _getTopic(slug: string) {
  const { data } = await supabase.from("topics").select("id,name,slug,color").eq("slug", slug).maybeSingle();
  return data as Topic | null;
}
async function _stats() {
  const [{ count: events }, { count: sources }] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).not("summary", "is", null),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("active", true),
  ]);
  return { events: events ?? 0, sources: sources ?? 0 };
}

/** Companies with the most events in the last 3 days (for "Trending"). */
async function _trendingCompanies(limit = 10) {
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const { data } = await supabase.from("events").select("company_ids").gt("last_article_at", since).not("summary", "is", null).limit(500);
  const count = new Map<number, number>();
  for (const e of data ?? []) for (const id of (e.company_ids as number[]) ?? []) count.set(id, (count.get(id) ?? 0) + 1);
  const top = [...count].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  const cos = await _companiesByIds(top);
  return top.map((id) => cos.find((c) => c.id === id)).filter(Boolean) as Company[];
}

/** Company names for a set of events, keyed by company id. */
export async function companyMap(events: EventRow[]) {
  const ids = [...new Set(events.flatMap((e) => e.company_ids))].slice(0, 300);
  return new Map((await companiesByIds(ids)).map((c) => [c.id, c]));
}

async function _searchEvents(q: string) {
  const term = q.replace(/[%_,()]/g, " ").trim().slice(0, 80);
  if (!term) return [] as EventRow[];
  const { data: cos } = await supabase.from("companies").select("id").ilike("name", `%${term}%`).limit(10);
  let query = supabase.from("events").select(EVENT_COLS).not("summary", "is", null);
  const ors = [`title.ilike.%${term}%`, `summary.ilike.%${term}%`];
  if (cos?.length) ors.push(`company_ids.ov.{${cos.map((c) => c.id).join(",")}}`);
  query = query.or(ors.join(","));
  const { data } = await query.order("importance", { ascending: false }).limit(40);
  return (data ?? []) as EventRow[];
}

export async function subscribe(email: string, lang: string) {
  const { error } = await supabase.rpc("subscribe", { e: email, l: lang });
  return !error;
}
export async function unsubscribe(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  const { data } = await supabase.rpc("unsubscribe", { t: token });
  return !!data;
}

async function _indices(grp = "indices") {
  const { data } = await supabase.from("market_series").select("name,value,change,series,digits,as_of").eq("grp", grp).order("sort");
  return (data ?? []) as { name: string; value: number; change: number; series: number[]; digits: number; as_of: string }[];
}
export const indices = unstable_cache(_indices, ["indices"], { revalidate: 600 });

async function _sitemapRows() {
  const [ev, co, tp] = await Promise.all([
    supabase.from("events").select("slug,title,title_zh,summary,category,image_url,started_at,last_article_at").not("summary", "is", null).neq("status", "archived").gte("source_count", 2).order("last_article_at", { ascending: false }).limit(5000),
    supabase.from("companies").select("slug").limit(3000),
    supabase.from("topics").select("slug"),
  ]);
  return {
    events: (ev.data ?? []) as { slug: string; title: string; title_zh: string | null; summary: string; category: string; image_url: string | null; started_at: string; last_article_at: string }[],
    companies: (co.data ?? []) as { slug: string }[], topics: (tp.data ?? []) as { slug: string }[],
  };
}
export const sitemapRows = unstable_cache(_sitemapRows, ["sitemapRows"], { revalidate: 600 });

// Cached reads: shared across requests for 60s, so switching language or pages does not wait for the database.
export const listEvents = unstable_cache(_listEvents, ["listEvents"], { revalidate: 60 });
export const getEvent = unstable_cache(_getEvent, ["getEvent"], { revalidate: 60 });
export const getLatestSummary = unstable_cache(_getLatestSummary, ["getLatestSummary"], { revalidate: 60 });
export const getFacts = unstable_cache(_getFacts, ["getFacts"], { revalidate: 60 });
export const getArticles = unstable_cache(_getArticles, ["getArticles"], { revalidate: 60 });
export const latestUpdates = unstable_cache(_latestUpdates, ["latestUpdates"], { revalidate: 60 });
export const allTopics = unstable_cache(_allTopics, ["allTopics"], { revalidate: 300 });
export const companiesByIds = unstable_cache(_companiesByIds, ["companiesByIds"], { revalidate: 60 });
export const getCompany = unstable_cache(_getCompany, ["getCompany"], { revalidate: 300 });
export const getTopic = unstable_cache(_getTopic, ["getTopic"], { revalidate: 300 });
export const stats = unstable_cache(_stats, ["stats"], { revalidate: 300 });
export const trendingCompanies = unstable_cache(_trendingCompanies, ["trendingCompanies"], { revalidate: 300 });
export const searchEvents = unstable_cache(_searchEvents, ["searchEvents"], { revalidate: 60 });

export async function reportError(eventId: number, kind: string, note: string, lang: string) {
  await supabase.from("feedback").insert({ event_id: eventId, kind: kind.slice(0, 20), note: note.slice(0, 1500) || null, lang });
}

export type SourceRow = { name: string; country: string; language: string; homepage: string | null; type: string };
async function _allSources() {
  const { data } = await supabase.from("sources").select("name,country,language,homepage,type").eq("active", true).order("country").order("name");
  return (data ?? []) as SourceRow[];
}
export const allSources = unstable_cache(_allSources, ["allSources"], { revalidate: 3600 });

// ---- follows (email alerts for a company or topic) ----
export async function followRpc(email: string, lang: string, companyId: number | null, topicId: number | null) {
  const { data, error } = await supabase.rpc("follow", { e: email, l: lang, cid: companyId, tid: topicId });
  return !error && data === true;
}
export async function followToken(token: string, action: "confirm" | "stop") {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  const { data } = await supabase.rpc(action === "confirm" ? "confirm_follow" : "unfollow", { t: token });
  return data === true;
}

// ---- corrections log ----
export type Correction = { id: number; event_slug: string | null; event_title: string | null; kind: string; detail_en: string; detail_zh: string | null; created_at: string };
async function _listCorrections(limit = 100) {
  const { data } = await supabase.from("corrections").select("id,event_slug,event_title,kind,detail_en,detail_zh,created_at").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Correction[];
}
async function _eventCorrections(eventId: number) {
  const { data } = await supabase.from("corrections").select("id,event_slug,event_title,kind,detail_en,detail_zh,created_at").eq("event_id", eventId).order("created_at", { ascending: false }).limit(20);
  return (data ?? []) as Correction[];
}
export const listCorrections = unstable_cache(_listCorrections, ["listCorrections"], { revalidate: 300 });
export const eventCorrections = unstable_cache(_eventCorrections, ["eventCorrections"], { revalidate: 120 });

// ---- archive by day (Melbourne time) ----
async function _eventsOnDay(day: string) {
  // Melbourne is UTC+10 or +11 (daylight saving); read the offset that applies on that day
  const off = new Intl.DateTimeFormat("en-US", { timeZone: "Australia/Melbourne", timeZoneName: "shortOffset" })
    .formatToParts(new Date(`${day}T12:00:00Z`)).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "+10";
  const [h, m = "00"] = off.replace(/^([+-])(\d+)/, "$1$2").split(":");
  const from = new Date(`${day}T00:00:00${h[0]}${h.slice(1).padStart(2, "0")}:${m}`), to = new Date(from.getTime() + 86400_000);
  const { data } = await supabase.from("events").select(EVENT_COLS).not("summary", "is", null).neq("status", "archived")
    .gte("started_at", from.toISOString()).lt("started_at", to.toISOString()).order("importance", { ascending: false }).limit(500);
  return (data ?? []) as EventRow[];
}
async function _archiveDays(days = 90) {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const counts = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from("events").select("started_at").not("summary", "is", null).neq("status", "archived").gte("started_at", since).range(from, from + 999);
    for (const r of data ?? []) { const d = new Date(r.started_at).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }); counts.set(d, (counts.get(d) ?? 0) + 1); }
    if (!data || data.length < 1000) break;
  }
  return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}
export const eventsOnDay = unstable_cache(_eventsOnDay, ["eventsOnDay"], { revalidate: 600 });
export const archiveDays = unstable_cache(_archiveDays, ["archiveDays"], { revalidate: 1800 });

// ---- companies directory ----
export type CompanyCard = { id: number; name: string; name_zh: string | null; slug: string; sector: string | null; country: string | null;
  logo_url: string | null; description: string | null; description_zh: string | null; industry: string | null; wikidata_id: string | null; events: number; last_at: string | null };
async function _companyDirectory() {
  const rows: Omit<CompanyCard, "events" | "last_at">[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from("companies").select("id,name,name_zh,slug,sector,country,logo_url,description,description_zh,industry,wikidata_id").order("id").range(from, from + 999);
    rows.push(...((data ?? []) as typeof rows)); if (!data || data.length < 1000) break;
  }
  const stats = new Map<number, { events: number; last_at: string | null }>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from("company_stats").select("company_id,events,last_at").range(from, from + 999);
    for (const r of data ?? []) stats.set(Number(r.company_id), { events: r.events, last_at: r.last_at });
    if (!data || data.length < 1000) break;
  }
  return rows.map((r) => ({ ...r, id: Number(r.id), ...(stats.get(Number(r.id)) ?? { events: 0, last_at: null }) })) as CompanyCard[];
}
export const companyDirectory = unstable_cache(_companyDirectory, ["companyDirectory"], { revalidate: 600 });

/** Directory shows notable companies only: known to Wikidata, or covered in at least 3 events. */
export const notable = (c: { wikidata_id: string | null; events: number }) => !!c.wikidata_id || c.events >= 3;
