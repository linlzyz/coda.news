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
    if (fa.length || ff.length) {
      await sql`select refresh_event(${e.id})`; fixed++; log(`audit ${e.id}: -${fa.length} articles, -${ff.length} facts`);
      // public corrections log
      const titles = arts.filter((a) => fa.includes(+a.id)).map((a) => `"${a.title.slice(0, 90)}"`).slice(0, 3).join(", ");
      const en = [fa.length ? `Removed ${fa.length} ${fa.length === 1 ? "article" : "articles"} that reported a different story${titles ? ` (${titles})` : ""}.` : "",
                  ff.length ? `Removed ${ff.length} ${ff.length === 1 ? "fact" : "facts"} that belonged to a different story.` : ""].filter(Boolean).join(" ");
      const zh = [fa.length ? `移除了 ${fa.length} 篇其实在报道另一件事的文章${titles ? `（${titles}）` : ""}。` : "",
                  ff.length ? `移除了 ${ff.length} 条属于另一件事的事实。` : ""].filter(Boolean).join("");
      await sql`insert into corrections (event_id, event_slug, event_title, kind, detail_en, detail_zh)
                select id, slug, title, ${fa.length ? "removed_articles" : "removed_facts"}, ${en}, ${zh} from events where id = ${e.id}`;    } else {
      // a clean check is logged too (once a day per event), so the log shows what was confirmed, not only what was wrong
      await sql`insert into corrections (event_id, event_slug, event_title, kind, detail_en, detail_zh)
        select e.id, e.slug, e.title, 'verified',
          ${`Re-checked ${arts.length} reports and ${facts.length} facts: all belong to this story, nothing to correct.`},
          ${`复查了 ${arts.length} 篇报道和 ${facts.length} 条事实，全部属于同一事件，无需更正。`}
        from events e where e.id = ${e.id} and cardinality(e.countries) >= 2
          and not exists (select 1 from corrections c where c.event_id = e.id and c.kind = 'verified' and c.created_at > now() - interval '1 day')`;
    }
  }
  return fixed;
}
