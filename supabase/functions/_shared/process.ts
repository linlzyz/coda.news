// Step 2: pending articles -> extraction -> embedding -> event matching -> facts -> event update.
import { db, vec } from "./db.ts";
import { log } from "./env.ts";
import { embed, generateJSON, onFallback } from "./ai.ts";
import { CATEGORIES, extractPrompt, verifyPrompt, PREDICATES, TOPICS } from "./prompts.ts";
import { fetchText, slugify } from "./text.ts";

const BATCH = 20;
const AUTO_MATCH = 0.95;   // cosine similarity: same event without asking the LLM
const ASK_MATCH = 0.83;    // between ASK and AUTO: LLM verifies
const MATCH_WINDOW_DAYS = 10;

interface Extracted {
  i: number; relevant: boolean; category?: string; regions?: string[]; headline_en?: string; event?: string; event_zh?: string; brief_zh?: string; is_rumor?: boolean;
  companies?: string[]; topics?: string[];
  facts?: { subject: string; predicate: string; object: string; qualifier?: string; occurred_at?: string; text?: string; text_zh?: string }[];
}

export async function processBatch(): Promise<{ claimed: number; relevant: number; newEvents: number; matched: number }> {
  const sql = db();
  // Groq fallback has a small per-minute token budget: fewer, shorter items per call
  const small = await onFallback();
  const BATCH_NOW = small ? 5 : BATCH, TEXT_MAX = small ? 700 : 2500;
  const rows = await sql<{ id: number; url: string; title: string; rss_summary: string | null; source_id: number; source: string; country: string; language: string; type: string }[]>`
    update articles a set status = 'processing', attempts = attempts + 1
    from sources s
    where s.id = a.source_id and a.id in (
      -- fair share: round-robin between priority tiers (newest first within each), so sections outside tech/economy are not starved
      select id from (
        select a2.id, s2.priority, row_number() over (partition by s2.priority order by a2.published_at desc nulls last) as rn
        from articles a2 join sources s2 on s2.id = a2.source_id where a2.status = 'pending'
      ) q order by (rn - 1) / (case when priority = 1 then 3 else 2 end), priority limit ${BATCH_NOW})
      and a.status = 'pending' and pg_try_advisory_xact_lock(a.id)
    returning a.id, a.url, a.title, a.rss_summary, a.source_id, s.name as source, s.country, s.language, s.type`;
  if (!rows.length) return { claimed: 0, relevant: 0, newEvents: 0, matched: 0 };

  try {
    // full text: internal analysis only, purged after 24h
    const texts = await Promise.all(rows.map((r) => fetchText(r.url)));
    for (let k = 0; k < rows.length; k++) if (texts[k]) await sql`update articles set full_text = ${texts[k]} where id = ${rows[k].id}`;

    const res = await generateJSON<{ items: Extracted[] }>(extractPrompt(rows.map((r, k) => ({
      i: k, country: r.country, source: r.source, lang: r.language, title: r.title,
      text: (texts[k] ?? r.rss_summary ?? "").slice(0, TEXT_MAX),
    }))), "fast");
    // models sometimes return the index as a string, or drop the list entirely: never treat that as "irrelevant"
    // deno-lint-ignore no-explicit-any
    const raw: any = res;
    const items: Extracted[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : (Object.values(raw ?? {}).find(Array.isArray) as Extracted[] | undefined) ?? [];
    if (items.length === 0) throw new Error("AI returned no items");
    const byI = new Map(items.map((x) => [Number(x.i), x]));

    const relevant = rows.map((r, k) => ({ r, x: byI.get(k) })).filter((o) => o.x?.relevant && o.x.event);
    const irrelevant = rows.filter((_, k) => !byI.get(k)?.relevant || !byI.get(k)?.event).map((r) => r.id);
    if (irrelevant.length) await sql`update articles set status = 'skipped', full_text = null where id in ${sql(irrelevant)}`;

    const vectors = await embed(relevant.map(({ x }) => `${x!.event}\n${x!.headline_en}`));
    let newEvents = 0, matched = 0;

    // sequential so that articles in this batch can join events created earlier in the batch
    for (let k = 0; k < relevant.length; k++) {
      const { r, x } = relevant[k]; const v = vectors[k];
      const cands = await sql<{ id: number; title: string; similarity: number }[]>`
        select * from match_events(${vec(v)}::extensions.vector, now() - make_interval(days => ${MATCH_WINDOW_DAYS}), 5)`;
      let eventId: number | null = null;
      if (cands[0] && cands[0].similarity >= AUTO_MATCH) eventId = Number(cands[0].id);
      else {
        const ask = cands.filter((c) => c.similarity >= ASK_MATCH);
        if (ask.length) {
          const ans = await generateJSON<{ match: number | null }>(verifyPrompt(x!.event!, ask), "fast");
          if (ans.match && ask.some((c) => Number(c.id) === Number(ans.match))) eventId = Number(ans.match);
        }
      }

      const companyIds = await upsertCompanies(x!.companies ?? []);
      const topicIds = await topicIdsFor(x!.topics ?? []);

      const regions = (x!.regions ?? []).filter((r) => /^[A-Z]{2}$/.test(r)).slice(0, 3);
      if (eventId) {
        matched++;
        await sql`update events set
            regions = (select coalesce(array_agg(distinct r), '{}') from unnest(regions || ${regions}::text[]) r),
            company_ids = (select coalesce(array_agg(distinct c), '{}') from unnest(company_ids || ${companyIds}::bigint[]) c),
            topic_ids   = (select coalesce(array_agg(distinct t), '{}') from unnest(topic_ids || ${topicIds}::int[]) t),
            is_rumor = is_rumor and ${!!x!.is_rumor}, needs_regen = true
          where id = ${eventId}`;
      } else {
        newEvents++;
        const [e] = await sql<{ id: number }[]>`
          insert into events (slug, title, category, embedding, company_ids, topic_ids, is_rumor, needs_regen, started_at, regions)
          values (${"tmp-" + crypto.randomUUID()}, ${x!.event!.slice(0, 200)}, ${CATEGORIES.includes(x!.category ?? "") ? x!.category! : "technology"},
                  ${vec(v)}::extensions.vector, ${companyIds}::bigint[], ${topicIds}::int[], ${!!x!.is_rumor}, true, now(), ${regions}::text[])
          returning id`;
        eventId = e.id;
        await sql`update events set slug = ${slugify(x!.event!, e.id)} where id = ${e.id}`;
      }

      await sql`update articles set status = 'done', event_id = ${eventId}, embedding = ${vec(v)}::extensions.vector,
                headline_en = ${x!.headline_en ?? null}, error = null where id = ${r.id}`;
      await addFacts(eventId, r.id, r.source_id, x!.facts ?? []);
      await sql`select refresh_event(${eventId})`;
      // narrative for a brand-new single-source event is assembled from its facts; AI writes it once a 2nd source arrives
      await sql`update events set summary = coalesce(summary, ${factSummary(x!)}), summary_generated_at = coalesce(summary_generated_at, now()),
                title_zh = coalesce(title_zh, ${x!.event_zh ?? null}), summary_zh = coalesce(summary_zh, ${x!.brief_zh ?? null})
                where id = ${eventId}`;
    }
    log(`process: ${rows.length} claimed, ${relevant.length} relevant, ${newEvents} new events, ${matched} matched`);
    return { claimed: rows.length, relevant: relevant.length, newEvents, matched };
  } catch (e) {
    // put unfinished items back; give up after 3 attempts
    const ids = rows.map((r) => r.id);
    await sql`update articles set status = case when attempts >= 3 then 'failed' else 'pending' end, error = ${(e as Error).message.slice(0, 300)}
              where id in ${sql(ids)} and status = 'processing'`;
    throw e;
  }
}

function factSummary(x: Extracted): string {
  const t = (x.facts ?? []).map((f) => f.text).filter(Boolean).slice(0, 3).join(" ");
  return t || x.event || "";
}

async function upsertCompanies(names: string[]): Promise<number[]> {
  const sql = db(); const ids: number[] = [];
  for (const raw of names.slice(0, 5)) {
    const name = raw.trim(); if (!name || name.length > 80) continue;
    const found = await sql<{ id: number }[]>`
      select id from companies where lower(name) = lower(${name}) or exists (select 1 from unnest(aliases) a where lower(a) = lower(${name})) limit 1`;
    if (found[0]) { ids.push(found[0].id); continue; }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `company`;
    const [c] = await sql<{ id: number }[]>`
      insert into companies (name, slug) values (${name}, ${slug})
      on conflict (name) do update set name = excluded.name returning id`.catch(async () =>
        sql<{ id: number }[]>`insert into companies (name, slug) values (${name}, ${slug + "-" + Date.now() % 10000}) on conflict (name) do update set name = excluded.name returning id`);
    ids.push(c.id);
  }
  return [...new Set(ids)];
}

let topicCache: Map<string, number> | null = null;
async function topicIdsFor(slugs: string[]): Promise<number[]> {
  if (!topicCache) topicCache = new Map((await db()<{ id: number; slug: string }[]>`select id, slug from topics`).map((t) => [t.slug, t.id]));
  return [...new Set(slugs.filter((s) => TOPICS.includes(s)).map((s) => topicCache!.get(s)!).filter(Boolean))];
}

async function addFacts(eventId: number, articleId: number, sourceId: number, facts: NonNullable<Extracted["facts"]>) {
  const sql = db();
  for (const f of facts.slice(0, 5)) {
    if (!f.subject || !f.predicate) continue;
    const predicate = PREDICATES.includes(f.predicate) ? f.predicate : "other";
    const occurred = /^\d{4}-\d{2}-\d{2}$/.test(f.occurred_at ?? "") ? new Date(f.occurred_at!) : new Date();
    // same triple already known for this event -> corroborate instead of duplicating
    const same = await sql<{ id: number }[]>`
      select id from event_updates where event_id = ${eventId} and type = 'fact'
        and lower(content->>'subject') = lower(${f.subject}) and content->>'predicate' = ${predicate}
        and lower(content->>'object') = lower(${f.object ?? ""}) limit 1`;
    if (same[0]) {
      await sql`update event_updates set
          source_ids = (select array_agg(distinct x) from unnest(source_ids || ${[sourceId]}::bigint[]) x),
          article_ids = article_ids || ${[articleId]}::bigint[]
        where id = ${same[0].id}`;
    } else {
      const content = { subject: f.subject, predicate, object: f.object ?? "", qualifier: f.qualifier ?? "", text: f.text ?? "", text_zh: f.text_zh ?? "" };
      await sql`insert into event_updates (event_id, type, content, source_ids, article_ids, occurred_at)
                values (${eventId}, 'fact', ${sql.json(content)}, ${[sourceId]}::bigint[], ${[articleId]}::bigint[], ${occurred})`;
    }
  }
}
