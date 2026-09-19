// Automatic editor: every new story is read once by the cheap model. Clear problems are fixed on the spot
// (off-topic stories taken down, wrong section corrected); only genuinely unsure cases are left for the owner.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { cheapJSON } from "./ai.ts";

const CATS = ["technology", "economy", "sport", "entertainment", "fashion", "travel", "automotive", "gaming"];
type Verdict = { v: "ok" | "hide" | "move" | "ask"; to?: string; why?: string };

export async function reviewEvents(limit = 40): Promise<{ checked: number; hidden: number; moved: number; flagged: number }> {
  const sql = db();
  const rows = await sql<{ id: number; slug: string; title: string; summary: string | null; category: string; countries: string[] }[]>`
    select id, slug, title, summary, category, countries from events
    where reviewed_at is null and not hidden and summary is not null and last_article_at > now() - interval '3 days'
    order by importance desc, last_article_at desc limit ${limit}`;
  if (!rows.length) return { checked: 0, hidden: 0, moved: 0, flagged: 0 };
  let res: { r?: Record<string, Verdict> } = {};
  try {
    res = await cheapJSON(`You are the final editor of coda.news, an international news site covering ONLY: technology, economy/business, sport, entertainment, fashion, travel (magazine style: hotels, destinations, airlines), automotive, gaming.
For each story decide:
"ok"   = fits the site and is in the right section.
"hide" = does not belong: party politics, elections, diplomacy, war or military, crime or police, courts, accidents or disasters, personal health or medical advice, addiction, religion, local or city-level government news or local promotion, opinion pieces, product reviews or shopping deals, or not a real news event. Laws, regulation, central banks, tariffs and government decisions that affect companies, markets, technology, travel or sport DO belong (keep them). Business news about drug makers, hospitals or health companies (trials, deals, share prices) belongs in economy. Celebrity news (engagements, weddings, breakups, babies, feuds, red carpets) belongs in entertainment: keep it.
"move" = fits the site but is in the wrong section; give "to" (one of: ${CATS.join(", ")}).
"ask"  = you really cannot tell.
Give "why" in a few words of Chinese for anything that is not "ok".
Return JSON only, an entry for EVERY story: {"r":{"1":{"v":"ok"},"2":{"v":"hide","why":"地方政务"},"3":{"v":"move","to":"technology","why":"网络安全属于科技"}}}
${rows.map((r, i) => `${i + 1}. [${r.category}] [${r.countries.join(",")}] ${r.title} | ${(r.summary ?? "").replace(/\s+/g, " ").slice(0, 160)}`).join("\n")}`);
  } catch (e) { log("review:", (e as Error).message.slice(0, 120)); return { checked: 0, hidden: 0, moved: 0, flagged: 0 }; }
  let hidden = 0, moved = 0, flagged = 0;
  const changed: string[] = [];
  for (const [i, r] of rows.entries()) {
    const x = res.r?.[String(i + 1)];
    if (!x) continue;   // left out: look again next run
    const why = (x.why ?? "").slice(0, 60) || null;
    if (x.v === "hide") { await sql`update events set hidden = true, reviewed_at = now(), review_note = ${"自动下架：" + (why ?? "")}, updated_at = now() where id = ${r.id}`; hidden++; changed.push(r.slug); }
    else if (x.v === "move" && x.to && CATS.includes(x.to) && x.to !== r.category) { await sql`update events set category = ${x.to}, reviewed_at = now(), review_note = ${`自动改分类：${r.category} → ${x.to}${why ? "（" + why + "）" : ""}`}, updated_at = now() where id = ${r.id}`; moved++; changed.push(r.slug); }
    else if (x.v === "ask") { await sql`update events set reviewed_at = now(), review_note = ${"待确认：" + (why ?? "")} where id = ${r.id}`; flagged++; }
    else await sql`update events set reviewed_at = now() where id = ${r.id}`;
  }
  log(`review: ${rows.length} checked, ${hidden} hidden, ${moved} moved, ${flagged} to confirm`);
  return { checked: rows.length, hidden, moved, flagged };
}
