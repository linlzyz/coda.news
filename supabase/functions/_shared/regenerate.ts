// Step 3: narratives are generated from stored facts + coverage, only when an event changed. Cached in the DB.
import { db, vec } from "./db.ts";
import { log } from "./env.ts";
import { embed, generateJSON } from "./ai.ts";
import { generatePrompt } from "./prompts.ts";

const DEBOUNCE_MIN = 10;

interface Generated {
  title: string; title_zh?: string; image_query?: string; image_person?: string; image_brand?: string; summary: string; summary_zh?: string; agreed?: string[]; agreed_zh?: string[]; differ?: string[]; differ_zh?: string[]; analysis?: string; analysis_zh?: string;
  perspectives?: { country: string; headline?: string; framing?: string; emphasis?: string; downplayed?: string; tone?: string; headline_zh?: string; framing_zh?: string; emphasis_zh?: string; downplayed_zh?: string }[];
}

export async function regenerate(limit = 3): Promise<number> {
  const sql = db();
  const events = await sql<{ id: number; title: string; source_count: number; summary_version: number; nc: number }[]>`
    select id, title, source_count, summary_version, cardinality(countries) as nc from events
    where needs_regen and (source_count >= 2 or has_official) and (summary_version = 0 or summary_generated_at is null or summary_generated_at < now() - make_interval(mins => ${DEBOUNCE_MIN}))
    order by (summary_generated_at is null) desc, importance desc, last_article_at desc limit ${limit}`;
  let done = 0;
  for (const e of events) {
    const facts = await sql<{ text: string; n: number }[]>`
      select coalesce(nullif(content->>'text',''), concat_ws(' ', content->>'subject', content->>'predicate', content->>'object', content->>'qualifier')) as text,
             coalesce(array_length(source_ids,1),1) as n
      from event_updates where event_id = ${e.id} and type = 'fact' order by n desc, occurred_at limit 25`;
    const arts = await sql<{ country: string; type: string; source: string; title: string; text: string }[]>`
      select s.country, s.type, s.name as source, coalesce(a.headline_en, a.title) as title,
             left(coalesce(a.full_text, a.rss_summary, ''), 700) as text
      from articles a join sources s on s.id = a.source_id
      where a.event_id = ${e.id} order by a.published_at desc limit 40`;
    const byCountry = new Map<string, { source: string; title: string; text: string }[]>();
    for (const a of arts.filter((a) => a.type !== "official")) {
      const list = byCountry.get(a.country) ?? []; if (list.length < 4) list.push(a); byCountry.set(a.country, list);
    }
    const g = await generateJSON<Generated>(generatePrompt({
      title: e.title,
      facts: facts.map((f) => `${f.text}${f.n > 1 ? ` (reported by ${f.n} sources)` : ""}`),
      official: arts.filter((a) => a.type === "official").slice(0, 3),
      byCountry: [...byCountry].map(([country, items]) => ({ country, items })),
    }), e.nc >= 2 ? "smart" : "fast");   // the careful model only where there is a cross-country comparison to make
    if (!g.title || !g.summary) continue;

    const version = e.summary_version + 1;
    const [v] = await embed([`${g.title}\n${g.summary}`]);
    await sql.begin(async (tx) => {
      await tx`update events set title = ${g.title.slice(0, 200)}, title_zh = ${g.title_zh ?? null}, zh_checked_at = null, summary = ${g.summary}, summary_zh = ${g.summary_zh ?? null},
                 summary_version = ${version}, summary_generated_at = now(), image_query = coalesce(image_query, ${g.image_query?.slice(0, 60) ?? null}), image_person = coalesce(image_person, ${g.image_person?.trim().slice(0, 80) || null}), image_brand = coalesce(image_brand, ${g.image_brand?.trim().slice(0, 80) || null}), needs_regen = false, embedding = ${vec(v)}::extensions.vector
               where id = ${e.id}`;
      const valid = (g.perspectives ?? []).filter((p) => byCountry.has(p.country));
      for (const p of valid) {
        const tone = ["positive", "neutral", "negative"].includes(p.tone ?? "") ? p.tone : "neutral";
        await tx`insert into perspectives (event_id, country, headline, framing, emphasis, downplayed, tone, article_count, updated_at,
                   headline_zh, framing_zh, emphasis_zh, downplayed_zh)
                 values (${e.id}, ${p.country}, ${p.headline ?? null}, ${p.framing ?? null}, ${p.emphasis ?? null}, ${p.downplayed ?? null}, ${tone!},
                         ${byCountry.get(p.country)!.length}, now(), ${p.headline_zh ?? null}, ${p.framing_zh ?? null}, ${p.emphasis_zh ?? null}, ${p.downplayed_zh ?? null})
                 on conflict (event_id, country) do update set headline = excluded.headline, framing = excluded.framing, emphasis = excluded.emphasis,
                   downplayed = excluded.downplayed, tone = excluded.tone, article_count = excluded.article_count, updated_at = now(),
                   headline_zh = excluded.headline_zh, framing_zh = excluded.framing_zh, emphasis_zh = excluded.emphasis_zh, downplayed_zh = excluded.downplayed_zh`;
      }
      await tx`insert into event_updates (event_id, type, content, version)
               values (${e.id}, 'summary_updated', ${tx.json({ title: g.title, summary: g.summary, agreed: g.agreed ?? [], agreed_zh: g.agreed_zh ?? [], differ: g.differ ?? [], differ_zh: g.differ_zh ?? [], analysis: g.analysis ?? "", analysis_zh: g.analysis_zh ?? "", perspectives: valid })}, ${version})`;
    });
    done++;
  }
  if (events.length) log(`regenerate: ${done}/${events.length} events`);
  return done;
}
