import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Public, read-only client. Row Level Security only allows reading published knowledge.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

export type Status = "rumor" | "breaking" | "developing" | "confirmed" | "resolved" | "archived";
export interface EventRow {
  id: number; slug: string; title: string; title_zh: string | null; category: string; status: Status; regions?: string[];
  confidence: number; importance: number; summary: string | null; summary_zh: string | null; countries: string[]; source_count: number;
  article_count: number; has_official: boolean; image_url: string | null; image_credit: string | null; image_link: string | null; company_ids: number[]; topic_ids: number[];
  started_at: string; last_article_at: string; summary_version: number;
}
export interface Perspective { country: string; headline: string | null; framing: string | null; emphasis: string | null; downplayed: string | null; tone: "positive" | "neutral" | "negative"; article_count: number; headline_zh: string | null; framing_zh: string | null; emphasis_zh: string | null; downplayed_zh: string | null }
export interface Topic { id: number; name: string; slug: string; color: string }
export interface Company { id: number; name: string; slug: string }

const EVENT_COLS = "id,slug,title,title_zh,category,status,confidence,importance,summary,summary_zh,countries,source_count,article_count,has_official,image_url,image_credit,image_link,company_ids,topic_ids,started_at,last_article_at,summary_version";

async function _listEvents(opts: { category?: string; region?: string; companyId?: number; topicId?: number; limit?: number; order?: "importance" | "recent" } = {}) {
  let q = supabase.from("events").select(EVENT_COLS).not("summary", "is", null).neq("status", "archived");
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.region) q = q.contains("regions", [opts.region]);
  if (opts.companyId) q = q.contains("company_ids", [opts.companyId]);
  if (opts.topicId) q = q.contains("topic_ids", [opts.topicId]);
  q = opts.order === "recent" ? q.order("last_article_at", { ascending: false }) : q.order("importance", { ascending: false }).order("last_article_at", { ascending: false });
  const { data, error } = await q.limit(opts.limit ?? 30);
  if (error) throw error;
  return (data ?? []) as EventRow[];
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
  return data?.content as { agreed?: string[]; agreed_zh?: string[]; analysis?: string; analysis_zh?: string } | undefined;
}

async function _getFacts(eventId: number) {
  const { data } = await supabase.from("event_updates").select("id,content,source_ids,occurred_at").eq("event_id", eventId).eq("type", "fact")
    .order("occurred_at", { ascending: false }).limit(40);
  return (data ?? []) as { id: number; content: { text: string; subject: string; predicate: string; object: string }; source_ids: number[]; occurred_at: string }[];
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
async function _getCompany(slug: string) {
  const { data } = await supabase.from("companies").select("id,name,slug,website,description").eq("slug", slug).maybeSingle();
  return data as (Company & { website: string | null; description: string | null }) | null;
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
    supabase.from("events").select("slug,title,title_zh,summary,category,image_url,started_at,last_article_at").not("summary", "is", null).order("last_article_at", { ascending: false }).limit(5000),
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
