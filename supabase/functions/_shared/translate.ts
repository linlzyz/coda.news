// Fill in missing Chinese titles/summaries (backfill + safety net). Cheap: 30 events per AI call.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { generateJSON } from "./ai.ts";

export async function translateMissing(limit = 30): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: string; title: string; summary: string }[]>`
    select id, title, summary from events where summary is not null and (title_zh is null or summary_zh is null)
    order by importance desc, last_article_at desc limit ${limit}`;
  if (!rows.length) return 0;
  const res = await generateJSON<{ items: { id: number; title_zh: string; summary_zh: string }[] }>(
    `Translate each news item into natural, neutral Simplified Chinese. Use 中国台湾 and 中国香港 for Taiwan and Hong Kong. Keep company names in their common Chinese form (or English if none).
Return JSON only: {"items":[{"id":1,"title_zh":"...","summary_zh":"..."}]}

${rows.map((r) => `id=${r.id}\nTITLE: ${r.title}\nSUMMARY: ${r.summary}`).join("\n\n")}`, "fast");
  let n = 0;
  for (const it of res.items ?? []) {
    if (!it.title_zh) continue;
    await sql`update events set title_zh = coalesce(title_zh, ${it.title_zh}), summary_zh = coalesce(summary_zh, ${it.summary_zh ?? null}) where id = ${it.id}`;
    n++;
  }
  log(`translate: ${n}/${rows.length}`);
  return n;
}
