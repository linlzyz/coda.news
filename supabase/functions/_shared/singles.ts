// Stories with one source: a proper short brief (summary + key points, en + zh) from the article itself, with the cheap model.
// Multi-source stories keep the full treatment in regenerate.ts.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { cheapJSON } from "./ai.ts";
import { fetchText } from "./text.ts";
import { EN_RULES, tidyPoints } from "./fixen.ts";
import { sourceEn } from "./source-names.ts";

interface Brief { summary: string; summary_zh: string; points: string[]; points_zh: string[] }

export async function briefSingles(limit = 12): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; title: string; url: string; source: string; text: string | null; rss: string | null }[]>`
    select e.id, e.title, a.url, s.name as source, a.full_text as text, a.rss_summary as rss
    from events e
    join lateral (select * from articles a where a.event_id = e.id order by a.published_at desc limit 1) a on true
    join sources s on s.id = a.source_id
    where e.summary_version = 0 and e.source_count < 2 and not e.has_official and e.status <> 'archived' and e.summary is not null
    order by e.last_article_at desc limit ${limit}`;
  let n = 0;
  for (const r of rows) {
    const text = r.text ?? await fetchText(r.url) ?? r.rss;
    if (!text || text.length < 80) { await sql`update events set summary_version = 1 where id = ${r.id}`; continue; }
    const srcEn = sourceEn(r.source);
    const prompt = `Write a short news brief for coda.news from this one article (${r.source}; in English call it ${srcEn}). Use only what the article says; no opinions, no filler. It is one outlet's report: attribute it once, in the summary ("According to ${srcEn}, ..." / "据 ${r.source} 报道，...") and never present it as confirmed by others.
${EN_RULES}
Return JSON only: {"summary":"2-3 sentences in English: what happened, who, the key numbers","summary_zh":"same in natural Simplified Chinese","points":["2-4 short English bullet points, each a concrete fact (who, what, where, numbers, dates) that is NOT already in the headline; do not start them with "According to" (the summary already names the source), but an outlet's opinion must still be attributed; fewer points for a short article, never pad or guess"],"points_zh":["the same points in Simplified Chinese"]}
Headline: ${r.title}
Article:
${text.slice(0, 4000)}`;
    try {
      const b = await cheapJSON<Brief>(prompt);
      if (!b?.summary || !b.summary_zh) continue;
      const pts = tidyPoints((b.points ?? []).filter(Boolean).slice(0, 5)), ptsZh = (b.points_zh ?? []).filter(Boolean).slice(0, 5);
      await sql.begin(async (tx) => {
        await tx`update events set summary = ${b.summary}, summary_zh = ${b.summary_zh}, zh_checked_at = null, summary_version = 1, summary_generated_at = now(),
                 points = ${pts.length ? tx.json({ en: pts, zh: ptsZh }) : null} where id = ${r.id}`;
        await tx`insert into event_updates (event_id, type, content, version)
                 values (${r.id}, 'summary_updated', ${tx.json({ title: r.title, summary: b.summary, agreed: pts, agreed_zh: ptsZh, analysis: "", analysis_zh: "", perspectives: [] })}, 1)`;
      });
      n++;
    } catch (e) { log("singles:", (e as Error).message.slice(0, 120)); break; }
  }
  if (rows.length) log(`singles: ${n}/${rows.length} briefs`);
  return n;
}
