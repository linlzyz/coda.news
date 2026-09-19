// Dead-link check. A one-source story is only as good as its link: when the original is gone (404/410, or the site sends us
// to its front page) we switch to another report of the same story if there is one, otherwise the story is taken down.
// Paywalls (401/402), bot blocks (403, 429) and timeouts are not treated as dead: a reader with a browser may still get in.
import { db } from "./db.ts";
import { log } from "./env.ts";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";

export async function linkState(url: string): Promise<"ok" | "dead" | "unknown"> {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": UA, accept: "text/html" } });
    await r.body?.cancel();
    if (r.status === 404 || r.status === 410) return "dead";
    if (!r.ok) return "unknown";
    const from = new URL(url), to = new URL(r.url);
    // an article URL that lands on the site's front page (or a bare section) has been removed
    const depth = (p: string) => p.split("/").filter(Boolean).length;
    if (depth(from.pathname) >= 2 && depth(to.pathname) <= 1 && to.pathname !== from.pathname) return "dead";
    return "ok";
  } catch { return "unknown"; }
}

export async function checkLinks(max = 25): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; lead_url: string }[]>`
    select id, lead_url from events where not hidden and source_count < 2 and lead_url is not null and status <> 'archived'
      and last_article_at < now() - interval '6 hours'
      and (link_checked_at is null or link_checked_at < now() - interval '1 day')
    order by link_checked_at nulls first, last_article_at desc limit ${max}`;
  let dead = 0;
  // fetch 8 pages at a time; database writes one after another (the connection pool is small)
  const states: ("ok" | "dead" | "unknown")[] = [];
  for (let i = 0; i < rows.length; i += 8) states.push(...await Promise.all(rows.slice(i, i + 8).map((r) => linkState(r.lead_url))));
  for (const [k, r] of rows.entries()) {
    const s = states[k];
    if (s !== "dead") { await sql`update events set link_checked_at = now() where id = ${r.id}`; continue; }
    dead++;
    await sql`update articles set dead_at = now() where event_id = ${r.id} and url = ${r.lead_url}`;
    const alt = await sql<{ url: string; source: string }[]>`select a.url, s.name as source from articles a join sources s on s.id = a.source_id
      where a.event_id = ${r.id} and a.dead_at is null and a.url <> ${r.lead_url} order by a.published_at desc limit 1`;
    if (alt[0]) await sql`update events set lead_url = ${alt[0].url}, lead_source = ${alt[0].source}, link_checked_at = null where id = ${r.id}`;
    else await sql`update events set hidden = true, review_note = '自动下架：原文链接已失效', reviewed_at = now(), link_checked_at = now() where id = ${r.id}`;
  }
  if (dead) log(`links: ${dead}/${rows.length} dead`);
  return dead;
}
