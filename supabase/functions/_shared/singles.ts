// Stories with one source: a proper short brief (summary + key points, en + zh) from the article itself, with the cheap model.
// Multi-source stories keep the full treatment in regenerate.ts.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { cheapJSON } from "./ai.ts";
import { fetchText } from "./text.ts";

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
    if (!text || text.length < 200) { await sql`update events set summary_version = 1 where id = ${r.id}`; continue; }
    const prompt = `Write a short news brief for coda.news from this one article (${r.source}). Use only what the article says; no opinions, no filler.
Return JSON only: {"summary":"2-3 sentences in English: what happened, who, the key numbers","summary_zh":"same in natural Simplified Chinese","points":["3-5 short English bullet points with the concrete facts, figures, dates and what it means for readers"],"points_zh":["the same points in Simplified Chinese"]}
Headline: ${r.title}
Article:
${text.slice(0, 4000)}`;
    try {
      const b = await cheapJSON<Brief>(prompt);
      if (!b?.summary || !b.summary_zh) continue;
      const pts = (b.points ?? []).filter(Boolean).slice(0, 5), ptsZh = (b.points_zh ?? []).filter(Boolean).slice(0, 5);
      await sql.begin(async (tx) => {
        await tx`update events set summary = ${b.summary}, summary_zh = ${b.summary_zh}, summary_version = 1, summary_generated_at = now() where id = ${r.id}`;
        await tx`insert into event_updates (event_id, type, content, version)
                 values (${r.id}, 'summary_updated', ${tx.json({ title: r.title, summary: b.summary, agreed: pts, agreed_zh: ptsZh, analysis: "", analysis_zh: "", perspectives: [] })}, 1)`;
      });
      n++;
    } catch (e) { log("singles:", (e as Error).message.slice(0, 120)); break; }
  }
  if (rows.length) log(`singles: ${n}/${rows.length} briefs`);
  return n;
}
