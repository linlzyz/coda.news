import "server-only";
import { createClient } from "@supabase/supabase-js";

// Public, read-only client. Row Level Security only allows reading published knowledge.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

export type Status = "rumor" | "breaking" | "developing" | "confirmed" | "resolved" | "archived";
export interface EventRow {
  id: number; slug: string; title: string; title_zh: string | null; category: "technology" | "economy"; status: Status;
  confidence: number; importance: number; summary: string | null; countries: string[]; source_count: number;
  article_count: number; has_official: boolean; image_url: string | null; company_ids: number[]; topic_ids: number[];
  started_at: string; last_article_at: string; summary_version: number;
}
export interface Perspective { country: string; headline: string | null; framing: string | null; emphasis: string | null; downplayed: string | null; tone: "positive" | "neutral" | "negative"; article_count: number }
export interface Topic { id: number; name: string; slug: string; color: string }
export interface Company { id: number; name: string; slug: string }

const EVENT_COLS = "id,slug,title,title_zh,category,status,confidence,importance,summary,countries,source_count,article_count,has_official,image_url,company_ids,topic_ids,started_at,last_article_at,summary_version";

export async function listEvents(opts: { category?: string; companyId?: number; topicId?: number; limit?: number; order?: "importance" | "recent" } = {}) {
  let q = supabase.from("events").select(EVENT_COLS).not("summary", "is", null).neq("status", "archived");
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.companyId) q = q.contains("company_ids", [opts.companyId]);
  if (opts.topicId) q = q.contains("topic_ids", [opts.topicId]);
  q = opts.order === "recent" ? q.order("last_article_at", { ascending: false }) : q.order("importance", { ascending: false }).order("last_article_at", { ascending: false });
  const { data, error } = await q.limit(opts.limit ?? 30);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function getEvent(slug: string) {
  const { data } = await supabase.from("events").select(EVENT_COLS).eq("slug", slug).maybeSingle();
  return data as EventRow | null;
}

export async function getPerspectives(eventIds: number[]) {
  if (!eventIds.length) return new Map<number, Perspective[]>();
  const { data } = await supabase.from("perspectives").select("event_id,country,headline,framing,emphasis,downplayed,tone,article_count").in("event_id", eventIds);
  const m = new Map<number, Perspective[]>();
  for (const p of (data ?? []) as (Perspective & { event_id: number })[]) m.set(p.event_id, [...(m.get(p.event_id) ?? []), p]);
  for (const list of m.values()) list.sort((a, b) => b.article_count - a.article_count);
  return m;
}

export async function getLatestSummary(eventId: number) {
  const { data } = await supabase.from("event_updates").select("content,version,created_at").eq("event_id", eventId).eq("type", "summary_updated")
    .order("version", { ascending: false }).limit(1).maybeSingle();
  return data?.content as { agreed?: string[]; analysis?: string } | undefined;
}

export async function getFacts(eventId: number) {
  const { data } = await supabase.from("event_updates").select("id,content,source_ids,occurred_at").eq("event_id", eventId).eq("type", "fact")
    .order("occurred_at", { ascending: false }).limit(40);
  return (data ?? []) as { id: number; content: { text: string; subject: string; predicate: string; object: string }; source_ids: number[]; occurred_at: string }[];
}

export async function getArticles(eventId: number) {
  const { data } = await supabase.from("articles").select("id,url,title,headline_en,published_at,sources(name,country,type)").eq("event_id", eventId)
    .order("published_at", { ascending: false }).limit(80);
  return (data ?? []) as unknown as { id: number; url: string; title: string; headline_en: string | null; published_at: string; sources: { name: string; country: string; type: string } }[];
}

export async function latestUpdates(limit = 14) {
  const { data } = await supabase.from("event_updates").select("id,type,content,created_at,events!inner(slug,title,status)")
    .eq("type", "fact").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as unknown as { id: number; content: { text: string }; created_at: string; events: { slug: string; title: string; status: Status } }[];
}

export async function allTopics() {
  const { data } = await supabase.from("topics").select("id,name,slug,color").order("id");
  return (data ?? []) as Topic[];
}
export async function companiesByIds(ids: number[]) {
  if (!ids.length) return [] as Company[];
  const { data } = await supabase.from("companies").select("id,name,slug").in("id", ids);
  return (data ?? []) as Company[];
}
export async function getCompany(slug: string) {
  const { data } = await supabase.from("companies").select("id,name,slug,website,description").eq("slug", slug).maybeSingle();
  return data as (Company & { website: string | null; description: string | null }) | null;
}
export async function getTopic(slug: string) {
  const { data } = await supabase.from("topics").select("id,name,slug,color").eq("slug", slug).maybeSingle();
  return data as Topic | null;
}
export async function stats() {
  const [{ count: events }, { count: sources }] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).not("summary", "is", null),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("active", true),
  ]);
  return { events: events ?? 0, sources: sources ?? 0 };
}
