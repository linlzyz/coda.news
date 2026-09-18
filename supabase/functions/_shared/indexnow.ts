// Tell Bing and other IndexNow search engines about new or updated event pages right away.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

export async function pingIndexNow(): Promise<number> {
  const key = env("INDEXNOW_KEY"); if (!key) return 0;
  const sql = db();
  const rows = await sql<{ id: number; slug: string }[]>`
    select id, slug from events where summary is not null and (indexed_at is null or indexed_at < updated_at - interval '30 minutes')
    order by importance desc limit 200`;
  if (!rows.length) return 0;
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST", headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "coda.news", key, keyLocation: `https://coda.news/${key}.txt`, urlList: rows.map((x) => `https://coda.news/event/${x.slug}`) }),
    signal: AbortSignal.timeout(15000),
  });
  if (r.status >= 300) { log("indexnow", r.status); return 0; }
  await sql`update events set indexed_at = now() where id in ${sql(rows.map((x) => x.id))}`;
  log(`indexnow: ${rows.length} urls`);
  return rows.length;
}
