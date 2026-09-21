// Quality control. Two parts:
// 1) invariants: fixed checks for mistakes we have already made once (Musk as Tesla's parent, a church as "BOC", stock photos on
//    fashion stories...). They must stay at zero; any hit shows up in the morning email.
// 2) sampling: a stronger model re-reads random stories from the last day against the original headline and summary and lists
//    concrete errors. The share of stories with an error is the number we steer by (goal: under 2%).
import { db } from "./db.ts";
import { log } from "./env.ts";
import { openai } from "./ai.ts";
import { CRIME } from "./screen.ts";

type Hit = { name: string; n: number; examples: string[] };

export async function invariants(): Promise<Hit[]> {
  const sql = db();
  const checks: [string, Promise<{ x: string }[]>][] = [
    ["公司的母公司写成了一个人", sql`select c.name || ' → ' || c.parent as x from companies c join companies p on lower(p.name) = lower(c.parent) where c.kind = 'company' and p.kind = 'person' limit 5`],
    ["公司库里的政府、军队、宗教机构", sql`select name as x from companies where kind = 'company' and description ~* '(navy|armed forces|military branch|church|exarchate|diocese|law enforcement agency|government department|ministry of)' and description !~* '(company|corporation|business)' limit 5`],
    ["人物被当成公司挂在新闻上", sql`select c.name as x from companies c where c.kind = 'person' and exists (select 1 from events e where c.id = any(e.company_ids) and not e.hidden) limit 5`],
    ["时尚新闻用了图库照片", sql`select title as x from events where not hidden and category = 'fashion' and image_source in ('pexels','unsplash','pixabay','openverse') limit 5`],
    ["单一来源新闻用了图库或人物照", sql`select title as x from events where not hidden and source_count < 2 and image_source in ('pexels','unsplash','pixabay','openverse','commons') limit 5`],
    ["中文里混进了其他文字（印地文、阿拉伯文、泰文）", sql`select title_zh as x from events where not hidden and (title_zh ~ '[\u0900-\u097F\u0600-\u06FF\u0E00-\u0E7F]' or summary_zh ~ '[\u0900-\u097F\u0600-\u06FF\u0E00-\u0E7F]') limit 5`],
    ["英文里混进了中日韩文字", sql`select title as x from events where not hidden and status <> 'archived' and en_checked_at is not null and (title ~ '[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]' or summary ~ '[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]' or coalesce(points->>'en', '') ~ '[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]') limit 5`],
    ["人物照片配到了没提到这个人的新闻", sql`select title || ' ← ' || image_person as x from events where not hidden and image_focus = 'top' and image_person is not null and lower(title || ' ' || coalesce(summary, '')) not like '%' || lower(split_part(image_person, ' ', -1)) || '%' limit 5`],
    ["已知错误回归：马斯克是特斯拉母公司", sql`select name as x from companies where name = 'Tesla' and parent ilike '%musk%'`],
    ["已知错误回归：荣耀创始人是华为", sql`select name as x from companies where name = 'Honor' and founders ilike '%huawei%'`],
    ["已知错误回归：真实公司被当成非公司", sql`select name as x from companies where name in ('Adobe','Nasdaq','OpenAI','The New York Times','China Mobile','YouTube','Tesla','Apple') and kind <> 'company'`],
  ];
  const out: Hit[] = [];
  for (const [name, q] of checks) {
    try { const rows = await q; if (rows.length) out.push({ name, n: rows.length, examples: rows.map((r) => r.x) }); }
    catch (e) { log("invariant", name, (e as Error).message.slice(0, 80)); }
  }
  // crime and police stories that slipped past the screen
  const crime = (await sql<{ title: string; summary: string | null }[]>`select title, null::text as summary from events where not hidden and status <> 'archived' and last_article_at > now() - interval '2 days'`)
    .filter((e) => CRIME.test(e.title))   // titles only: drama plots and film synopses mention police too.map((e) => e.title);
  if (crime.length) out.push({ name: "犯罪新闻漏过过滤", n: crime.length, examples: crime.slice(0, 5).map((c) => c.title) });
  return out;
}

const PROMPT = (items: string) => `You are the fact-checker for coda.news, a news site that summarises what outlets report. For each story below you get what we published and the original article's own headline and summary.
List only real, concrete errors a careful editor would fix:
- title: our headline says something the original does not, or gets a name, number or date wrong
- summary: a claim not supported by the original; an outlet's opinion presented as fact; the summary only repeats the headline
- chinese: the Chinese text mistranslates a name, number or meaning
- english: the English text leaves names in Chinese, Japanese or Korean characters, or reads as a clumsy word-for-word translation
- category: clearly the wrong section (economy, technology, sport, entertainment, fashion, travel, automotive, gaming)
- banned: the story is really about crime, police, court cases, accidents, politics, a person's health, or purely local/city news
- companies: a tagged "company" is not a company or brand, or is the wrong one
- image: the image description does not fit the story (e.g. a stock photo of unrelated people)
Do not report style preferences. If there is nothing wrong, return an empty list.
When there is a "chinese" error, also return the corrected Chinese text in "fix": {"title_zh":"...","summary_zh":"..."} (only the fields that need fixing, full corrected text).
Return JSON only: {"r":{"1":{"issues":[{"field":"summary","problem":"short explanation"}],"fix":{}},"2":{"issues":[]}}} with an entry for EVERY story.
${items}`;

export async function auditSample(n = 3): Promise<number> {
  const sql = db();
  const [{ recent }] = await sql<{ recent: number }[]>`select count(*)::int recent from qa_checks where checked_at > now() - interval '1 hour'`;
  if (recent >= 2) return 0;   // about two stories an hour, ~50 a day
  const rows = await sql<{ id: number; title: string; title_zh: string | null; category: string; summary: string | null; summary_zh: string | null;
      points: { en?: string[] } | null; image_source: string | null; image_credit: string | null; image_query: string | null; cos: string | null; src_title: string | null; src_sum: string | null; source: string | null }[]>`
    select e.id, e.title, e.title_zh, e.category, e.summary, e.summary_zh, e.points, e.image_source, e.image_credit, e.image_query,
      (select string_agg(c.name, ', ') from companies c where c.id = any(e.company_ids)) cos,
      a.title src_title, left(a.rss_summary, 600) src_sum, s.name source
    from events e
    left join lateral (select * from articles a where a.event_id = e.id order by a.published_at limit 1) a on true
    left join sources s on s.id = a.source_id
    where not e.hidden and e.summary is not null and e.last_article_at > now() - interval '24 hours'
      and not exists (select 1 from qa_checks q where q.event_id = e.id)
    order by random() limit ${n}`;
  if (!rows.length) return 0;
  const items = rows.map((r, k) => `${k + 1}.
PUBLISHED title: ${r.title}
PUBLISHED title (zh): ${r.title_zh ?? ""}
section: ${r.category}
PUBLISHED summary: ${r.summary}
PUBLISHED summary (zh): ${r.summary_zh ?? ""}
${r.points?.en?.length ? `PUBLISHED key points: ${r.points.en.join(" | ")}\n` : ""}tagged companies: ${r.cos ?? "none"}
image: ${r.image_source ? `${r.image_source}; ${r.image_credit ?? ""}; searched for "${r.image_query ?? ""}"` : "none"}
ORIGINAL (${r.source}): ${r.src_title ?? ""} ${r.src_sum ? "| " + r.src_sum : ""}`).join("\n\n");
  let res: { r?: Record<string, { issues?: { field: string; problem: string }[]; fix?: { title_zh?: string; summary_zh?: string } }> } = {};
  try { res = JSON.parse(await openai(PROMPT(items), "gpt-5-mini", 6000, "low")); }
  catch (e) { log("qa:", (e as Error).message.slice(0, 120)); return 0; }
  let bad = 0;
  for (const [k, r] of rows.entries()) {
    const v = res.r?.[String(k + 1)];
    const issues = (v?.issues ?? []).filter((x) => x?.field && x?.problem).slice(0, 5);
    // translation slips (Monet as "Mona Lisa") are fixed on the spot; everything else waits for the owner
    const fix = v?.fix ?? {};
    if (fix.title_zh && fix.title_zh.length > 3) await sql`update events set title_zh = ${fix.title_zh.slice(0, 300)} where id = ${r.id}`;
    if (fix.summary_zh && fix.summary_zh.length > 10) await sql`update events set summary_zh = ${fix.summary_zh.slice(0, 2000)} where id = ${r.id}`;
    const rest = issues.filter((i) => !(i.field === "chinese" && (fix.title_zh || fix.summary_zh)));
    await sql`insert into qa_checks (event_id, ok, issues) values (${r.id}, ${issues.length === 0}, ${sql.json(issues)})`;
    if (issues.length) bad++;
    if (rest.length) {
      // anything flagged goes to the owner's "to confirm" list, unless the auto editor already hid it
      await sql`update events set review_note = ${"待确认：抽检发现 " + rest.map((i) => `${i.field}: ${i.problem}`).join("；").slice(0, 300)}, reviewed_at = now()
                where id = ${r.id} and not hidden`;
    }
  }
  log(`qa: ${bad}/${rows.length} with errors`);
  return rows.length;
}

/** Numbers for the morning email. */
export async function qaSummary() {
  const sql = db();
  const [s] = await sql<{ n: number; bad: number }[]>`select count(*)::int n, count(*) filter (where not ok)::int bad from qa_checks where checked_at > now() - interval '24 hours'`;
  const fields = await sql<{ field: string; n: number }[]>`select i->>'field' field, count(*)::int n from qa_checks, jsonb_array_elements(issues) i
    where checked_at > now() - interval '24 hours' group by 1 order by 2 desc`;
  return { n: s.n, bad: s.bad, rate: s.n ? Math.round((s.bad / s.n) * 1000) / 10 : 0, fields, inv: await invariants() };
}
