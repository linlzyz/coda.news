// English quality pass: when a Chinese, Japanese or Korean source is summarised, the model sometimes leaves names in
// their own script ("According to 虎嗅, 何小鹏 ...") or starts every key point with "According to ...". This rewrites the
// English title, summary and key points with the standard English names (Huxiu, He Xiaopeng, XPeng) and attributes once.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { openai } from "./ai.ts";
import { enSources } from "./source-names.ts";

// Han, kana and Hangul
export const CJK = "[\\u3040-\\u30FF\\u3400-\\u9FFF\\uF900-\\uFAFF\\uAC00-\\uD7AF]";

/** Drop a repeated "According to X," lead from key points (the summary already names the source). */
export function tidyPoints(pts: string[]): string[] {
  const lead = /^(According to [^,]{1,60}, |[^,]{1,60} (says|reports|said|reported) (that )?)/i;
  if (pts.length < 2 || pts.filter((p) => lead.test(p)).length < 2) return pts;
  return pts.map((p) => { const t = p.replace(lead, ""); return t.charAt(0).toUpperCase() + t.slice(1); });
}

export const EN_RULES = `English text must be entirely in English: write the names of people who appear in the article in their usual English form (pinyin for Chinese names, the usual romanisation for Korean and Japanese names), and companies and outlets by their usual English names. Never leave Chinese, Japanese or Korean characters in the English, and never add a name that is not in the article.`;

export async function fixEnglish(limit = 12): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; title: string; summary: string | null; points: { en?: string[]; zh?: string[] } | null; title_zh: string | null }[]>`
    select id, title, summary, points, title_zh from events
    where status <> 'archived' and not hidden and en_checked_at is null
      and (title ~ ${CJK} or summary ~ ${CJK} or coalesce(points->>'en', '') ~ ${CJK})
    order by last_article_at desc limit ${limit}`;
  if (!rows.length) return 0;
  const re = new RegExp(CJK);
  let n = 0;
  // 1) outlet names have fixed English names: swap those without a model
  for (const r of rows) {
    const en = r.points?.en?.map(enSources);
    const t = enSources(r.title), s = r.summary ? enSources(r.summary) : r.summary;
    const p = en ? tidyPoints(en) : undefined;
    if (t !== r.title || s !== r.summary || JSON.stringify(p) !== JSON.stringify(r.points?.en)) {
      r.title = t; r.summary = s; if (r.points && p) r.points = { ...r.points, en: p };
      await sql`update events set title = ${t}, summary = ${s}, points = ${r.points ? sql.json(r.points) : null} where id = ${r.id}`;
      if (p) await sql`update event_updates set content = jsonb_set(content, '{agreed}', ${sql.json(p)}) where event_id = ${r.id} and type = 'summary_updated' and version = 1 and content ? 'agreed'`;
      n++;
    }
  }
  const clean = (r: (typeof rows)[number]) => !re.test(r.title) && !re.test(r.summary ?? "") && !(r.points?.en ?? []).some((x) => re.test(x));
  for (const r of rows.filter(clean)) await sql`update events set en_checked_at = now() where id = ${r.id}`;
  const todo = rows.filter((r) => !clean(r));
  if (!todo.length) { log(`fixen: ${n}/${rows.length} (names only)`); return n; }
  // 2) the rest (people, companies, places) needs the model
  try {
    // gpt-5-mini: nano kept leaving names untranslated
    const res = JSON.parse(await openai(`These English news items contain Chinese, Japanese or Korean characters. Rewrite each in natural English with the same meaning, adding nothing. Every name, title, venue or event name must end up in English or romanised; the output must contain no Chinese, Japanese or Korean characters at all.
${EN_RULES}
Key points (p): keep the same number and order; do not start every point with "According to ..." (the summary already names the source).
Return JSON only: {"r":{"1":{"t":"title","s":"summary","p":["point", "..."]}}}
${todo.map((r, i) => `${i + 1}. t: ${r.title}\ns: ${r.summary ?? ""}\np: ${JSON.stringify(r.points?.en ?? [])}\n(Chinese title for reference: ${r.title_zh ?? ""})`).join("\n\n")}`, "gpt-5-mini", 8000, "low")) as { r?: Record<string, { t?: string; s?: string; p?: string[] }> };
    for (const [i, r] of todo.entries()) {
      const v = res.r?.[String(i + 1)];
      const t = v?.t?.trim(), s = v?.s?.trim();
      const p = Array.isArray(v?.p) && v!.p!.length === (r.points?.en ?? []).length ? tidyPoints(v!.p!.map((x) => String(x).trim())) : null;
      // only take a rewrite that actually got rid of the foreign script
      // take each rewritten field that got rid of the foreign script
      const ok = (x?: string | null) => !!x && !re.test(x);
      const title = ok(t) ? t! : r.title, summary = ok(s) ? s! : r.summary;
      // point by point: keep a rewritten point only if it is clean
      const merged = p ? p.map((x, k) => (ok(x) ? x : r.points!.en![k])) : null;
      const points = merged && JSON.stringify(merged) !== JSON.stringify(r.points?.en) ? { ...r.points, en: merged } : r.points;
      if (!ok(t) && re.test(r.title) || !ok(s) && re.test(r.summary ?? "")) log(`fixen: ${r.id} still has CJK: ${JSON.stringify(v).slice(0, 160)}`);
      await sql`update events set title = ${title}, summary = ${summary}, points = ${points ? sql.json(points) : null}, en_checked_at = now() where id = ${r.id}`;
      if (points !== r.points) await sql`update event_updates set content = jsonb_set(content, '{agreed}', ${sql.json(points!.en ?? [])}) where event_id = ${r.id} and type = 'summary_updated' and version = 1 and content ? 'agreed'`;
      if (title !== r.title || summary !== r.summary || points !== r.points) n++;
    }
  } catch (e) { log("fixen:", (e as Error).message.slice(0, 120)); }
  log(`fixen: ${n}/${rows.length}`);
  return n;
}
