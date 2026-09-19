// Chinese quality pass: headlines and summaries where a stray English word slipped into the Chinese
// (e.g. "暂时 restraint 抗议者") are rewritten in natural Chinese by the cheap model. Names, brands and titles stay as they are.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { cheapJSON } from "./ai.ts";

// stray lowercase English words, or characters from another script (Hindi, Arabic, Thai) that a model mixed into Chinese
const STRAY = "(^|[^A-Za-z])[a-z]{4,}([^A-Za-z]|$)|[\\u0900-\\u097F\\u0600-\\u06FF\\u0E00-\\u0E7F]";

export async function fixChinese(limit = 20): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; title: string; title_zh: string; summary_zh: string | null }[]>`
    select id, title, title_zh, summary_zh from events
    where status <> 'archived' and zh_checked_at is null and (title_zh ~ ${STRAY} or summary_zh ~ ${STRAY})
    order by last_article_at desc limit ${limit}`;
  if (!rows.length) return 0;
  let n = 0;
  try {
    const res = await cheapJSON<{ r?: Record<string, { t?: string; s?: string }> }>(`These Chinese news headlines (t) and summaries (s) contain stray English words or broken translation.
Rewrite each in natural, fluent Simplified Chinese with the same meaning. Keep proper names, brands, product and work titles as they are (e.g. iPhone, sacai, 《Samuk》). Do not add anything.
Return JSON only: {"r":{"1":{"t":"...","s":"..."}}}
${rows.map((r, i) => `${i + 1}. English: ${r.title}\nt: ${r.title_zh}\ns: ${r.summary_zh ?? ""}`).join("\n\n")}`);
    for (const [i, r] of rows.entries()) {
      const v = res.r?.[String(i + 1)];
      const t = v?.t?.trim(), s = v?.s?.trim();
      await sql`update events set title_zh = ${t || r.title_zh}, summary_zh = ${s || r.summary_zh}, zh_checked_at = now() where id = ${r.id}`;
      if (t || s) n++;
    }
  } catch (e) { log("fixzh:", (e as Error).message.slice(0, 120)); }
  log(`fixzh: ${n}/${rows.length}`);
  return n;
}
