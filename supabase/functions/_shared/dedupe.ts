// Safety net: merge events that describe the same story (e.g. created in parallel). LLM confirms every merge.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { generateJSON } from "./ai.ts";
import { verifyPrompt } from "./prompts.ts";

export async function dedupe(maxChecks = 6): Promise<number> {
  const sql = db();
  const pairs = await sql<{ keep: string; drop: string; keep_title: string; drop_title: string; sim: number }[]>`
    select distinct on (b.id) a.id as keep, b.id as drop, a.title as keep_title, b.title as drop_title, 1 - (a.embedding <=> b.embedding) as sim
    from events b join lateral (
      select a.* from events a where a.id < b.id and a.embedding is not null and a.last_article_at > now() - interval '10 days'
      order by a.embedding <=> b.embedding limit 1) a on true
    where b.embedding is not null and b.last_article_at > now() - interval '2 days' and not b.dedupe_checked
      and 1 - (a.embedding <=> b.embedding) >= 0.78
    order by b.id, sim desc limit ${maxChecks}`;
  let merged = 0; const gone = new Set<number>();
  for (const p of pairs) {
    if (gone.has(Number(p.keep)) || gone.has(Number(p.drop))) continue;
    const ans = await generateJSON<{ match: number | null }>(verifyPrompt(p.drop_title, [{ id: Number(p.keep), title: p.keep_title }]), "fast");
    if (Number(ans.match) === Number(p.keep)) { if (await mergeEvents(Number(p.keep), Number(p.drop))) { merged++; gone.add(Number(p.drop)); } }
    else await sql`update events set dedupe_checked = true where id = ${p.drop}`;
  }
  if (pairs.length) log(`dedupe: checked ${pairs.length}, merged ${merged}`);
  return merged;
}

export async function mergeEvents(keep: number, drop: number): Promise<boolean> {
  const sql = db();
  const exists = await sql`select id from events where id in ${sql([keep, drop])}`;
  if (exists.length < 2) return false;
  await sql.begin(async (tx) => {
    await tx`select id from events where id in ${tx([keep, drop])} for update`;
    await tx`update articles set event_id = ${keep} where event_id = ${drop}`;
    await tx`update event_updates set event_id = ${keep} where event_id = ${drop} and type = 'fact'`;
    await tx`update events k set company_ids = (select coalesce(array_agg(distinct c),'{}') from unnest(k.company_ids || d.company_ids) c),
               topic_ids = (select coalesce(array_agg(distinct t),'{}') from unnest(k.topic_ids || d.topic_ids) t), needs_regen = true
             from events d where k.id = ${keep} and d.id = ${drop}`;
    await tx`insert into corrections (event_id, event_slug, event_title, kind, detail_en, detail_zh)
             select k.id, k.slug, k.title, 'merged', 'Merged a duplicate page about the same story: "' || left(d.title, 120) || '".',
                    '合并了一个报道同一件事的重复页面：“' || left(coalesce(d.title_zh, d.title), 120) || '”。'
             from events k, events d where k.id = ${keep} and d.id = ${drop}`;
    await tx`delete from events where id = ${drop}`;
    await tx`select refresh_event(${keep})`;
  });
  return true;
}
