// Quality check for events that grew from several articles: detach articles and drop facts that belong to a different story.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { generateJSON } from "./ai.ts";

export async function auditEvents(limit = 3): Promise<number> {
  const sql = db();
  const events = await sql<{ id: string; title: string }[]>`
    select id, title from events where article_count >= 3 and (audited_at is null or audited_at < updated_at - interval '2 hours')
    order by importance desc limit ${limit}`;
  let fixed = 0;
  for (const e of events) {
    const arts = await sql<{ id: string; title: string }[]>`select id, coalesce(headline_en, title) as title from articles where event_id = ${e.id} limit 60`;
    const facts = await sql<{ id: string; text: string }[]>`select id, coalesce(content->>'text','') as text from event_updates where event_id = ${e.id} and type = 'fact' limit 60`;
    const r = await generateJSON<{ foreign_articles: number[]; foreign_facts: number[] }>(`You check a news event page for items that belong to a DIFFERENT story.
EVENT: ${e.title}
ARTICLES:
${arts.map((a) => `a${a.id}: ${a.title}`).join("\n")}
FACTS:
${facts.map((f) => `f${f.id}: ${f.text}`).join("\n")}
List the ids (numbers only) of articles and facts that are about a different story (other company, other decision, other country's separate event, market roundup). Keep direct follow-ups and reactions to this event.
Return JSON only: {"foreign_articles":[123],"foreign_facts":[456]}`, "fast");
    const fa = (r.foreign_articles ?? []).map(Number).filter((x) => arts.some((a) => +a.id === x));
    const ff = (r.foreign_facts ?? []).map(Number).filter((x) => facts.some((f) => +f.id === x));
    if (fa.length) await sql`update articles set event_id = null, status = 'skipped' where id in ${sql(fa)}`;
    if (ff.length) await sql`delete from event_updates where id in ${sql(ff)}`;
    await sql`update events set audited_at = now(), needs_regen = ${fa.length + ff.length > 0} or needs_regen where id = ${e.id}`;
    if (fa.length || ff.length) { await sql`select refresh_event(${e.id})`; fixed++; log(`audit ${e.id}: -${fa.length} articles, -${ff.length} facts`); }
  }
  return fixed;
}
