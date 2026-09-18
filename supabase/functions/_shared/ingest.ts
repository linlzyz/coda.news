// Step 1: fetch RSS from all active sources, store only NEW articles as pending.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { parseFeed, UA } from "./text.ts";

const MAX_AGE_H = 48;        // ignore items older than this
const MAX_PER_SOURCE = 30;   // newest N items per feed per run
const MIN_INTERVAL_MIN = 5;  // don't refetch a source more often than this

export async function ingest(): Promise<{ sources: number; added: number; failed: number }> {
  const sql = db();
  const sources = await sql<{ id: number; name: string; rss_url: string; type: string }[]>`
    select id, name, rss_url, type from sources
    where active and (last_fetched_at is null or last_fetched_at < now() - make_interval(mins => ${MIN_INTERVAL_MIN}))
    order by last_fetched_at nulls first`;
  let added = 0, failed = 0;
  const cutoff = Date.now() - MAX_AGE_H * 3600_000;

  const work = async (s: typeof sources[number]) => {
    try {
      // some servers (notably in mainland China) are slow from overseas: longer timeout and one retry
      let r: Response;
      try { r = await fetch(s.rss_url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30000) }); }
      catch { r = await fetch(s.rss_url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30000) }); }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const items = parseFeed(await r.text())
        .filter((i) => !i.published || +i.published > cutoff)
        .filter((i) => !i.published || +i.published < Date.now() + 3600_000)
        .sort((a, b) => +(b.published ?? 0) - +(a.published ?? 0))
        .slice(0, MAX_PER_SOURCE);
      if (items.length) {
        const rows = items.map((i) => ({
          source_id: s.id, url: i.url, title: i.title.slice(0, 500), rss_summary: i.summary || null,
          published_at: i.published ?? new Date(),
          // image rule: publisher images are never used (licence unclear); photos come from open-licence libraries only
          image_url: null,
        }));
        const res = await sql`insert into articles ${sql(rows)} on conflict (url) do nothing returning id`;
        added += res.length;
      }
      await sql`update sources set last_fetched_at = now(), last_status = ${`ok ${items.length}`}, fail_count = 0 where id = ${s.id}`;
    } catch (e) {
      failed++;
      const msg = (e as Error).message.slice(0, 200);
      await sql`update sources set last_fetched_at = now(), last_status = ${"error: " + msg}, fail_count = fail_count + 1 where id = ${s.id}`;
    }
  };
  // small concurrency pool
  const queue = [...sources];
  await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await work(queue.shift()!); }));
  log(`ingest: ${sources.length} sources, +${added} articles, ${failed} failed`);
  return { sources: sources.length, added, failed };
}
