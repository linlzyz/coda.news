import "server-only";
// Coda Anatomy issues from the database (table anatomy_profiles), merged with the ones still written in src/lib/anatomy.ts.
// A cloud session publishes an issue by inserting a row: no code push. The row goes live when publish_at passes;
// the tick function then refreshes the anatomy pages through /api/revalidate (tag "anatomy").
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { PROFILES, type Photo, type Profile } from "@/lib/anatomy";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

// cached for 30 days (so it never shortens a page's own refresh interval); the tick "anatomy" step clears tag "anatomy" when an issue goes live or changes
const live = unstable_cache(async (): Promise<Profile[]> => {
  const r = await supabase.from("anatomy_profiles").select("slug,no,data,publish_at");
  // throw, so the cache keeps the last good copy instead of storing an empty list
  if (r.error) throw new Error(`supabase: ${r.error.message}`);
  return (r.data ?? []).map((x) => ({ ...(x.data as Profile), slug: x.slug, no: x.no }));
}, ["anatomy-live"], { revalidate: 2592000, tags: ["anatomy"] });

/** every published issue (database rows replace code profiles with the same slug) */
export async function listProfiles(): Promise<Profile[]> {
  const db = await live().catch(() => [] as Profile[]);
  const slugs = new Set(db.map((p) => p.slug));
  return [...PROFILES.filter((p) => !slugs.has(p.slug)), ...db];
}

export async function findProfile(slug: string): Promise<Profile | null> {
  return (await listProfiles()).find((p) => p.slug === slug) ?? null;
}

/** an unpublished issue, only with its draft key (preview links) */
export async function draftProfile(slug: string, key: string): Promise<Profile | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !/^[0-9a-f]{16,64}$/.test(key)) return null;
  const r = await supabase.rpc("anatomy_draft", { p_slug: slug, p_key: key });
  if (r.error || !r.data) return null;
  return { ...(r.data as Profile), slug };
}

/** every Commons file used by any issue, drafts included (for /anatomy-img) */
export async function photoFiles(): Promise<string[]> {
  const files = new Set<string>();
  const add = (p?: Photo) => { if (p && !p.own) files.add(p.file); };
  for (const p of PROFILES) { add(p.cover); p.sections.forEach((s) => add(s.photo)); }
  const r = await supabase.rpc("anatomy_photo_files");
  if (!r.error) for (const f of (r.data ?? []) as string[]) files.add(f);
  return [...files];
}
