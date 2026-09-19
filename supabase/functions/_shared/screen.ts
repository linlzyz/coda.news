// First pass, before any full-text AI work: rules, then a cheap model reading only the title and RSS summary.
// Only clearly irrelevant items are dropped; anything uncertain is kept. Every decision is stored and can be re-run.
import { db } from "./db.ts";
import { log } from "./env.ts";
import { cheapJSON } from "./ai.ts";

// obvious non-news by title (free, no AI)
// crime and policing stories never fit coda.news, whatever section they would land in (e.g. "Thai police arrest fugitive tied to Pattaya tourism")
export const CRIME = /\b((?<!cardiac )arrest(ed|s)?|fugitive|murder(ed|er)?|homicide|stabb(ed|ing)|shooting|gunman|kidnap(ped|ping)?|smuggl(ing|er|ed)|traffick(ing|er)|drug (bust|lord|ring)|jailed|imprisoned|sentenced|convicted|extradit(ed|ion))\b|逮捕|逃犯|通缉|警方|嫌犯|嫌疑人|被捕|拘留|刑拘|判刑|诈骗团伙|走私|贩毒|杀人|命案/i;
const RULE = /\b(horoscope|astrology|wordle|crossword|sudoku|quiz|recipe|recipes|live blog|live updates|as it happened|deal of the day|best deals|discount code|coupon|podcast|newsletter|weather forecast|lottery|obituar)/i;

export async function screenArticles(limit = 360): Promise<{ screened: number; dropped: number }> {
  const sql = db();
  const rows = await sql<{ id: number; title: string; rss_summary: string | null; country: string; source: string; type: string }[]>`
    select a.id, a.title, a.rss_summary, s.country, s.name as source, s.type from articles a join sources s on s.id = a.source_id
    where a.status = 'pending' and a.screened_at is null order by a.published_at desc nulls last limit ${limit}`;
  if (!rows.length) return { screened: 0, dropped: 0 };
  let dropped = 0;
  const ruled = rows.filter((r) => r.type !== "official" && (RULE.test(r.title) || CRIME.test(r.title)));
  if (ruled.length) {
    await sql`update articles set status = 'skipped', screen = 'rule', screened_at = now() where id in ${sql(ruled.map((r) => r.id))}`;
    dropped += ruled.length;
  }
  const rest = rows.filter((r) => !ruled.includes(r));
  for (let i = 0; i < rest.length; i += 60) {
    const chunk = rest.slice(i, i + 60);
    const prompt = `You screen news items for coda.news.
K = keep: a specific, new event in technology, business/economy/markets, sport (results, transfers, squads, coaches), entertainment (releases, box office, awards, celebrities), fashion (shows, collections, brands, designers), travel (airlines, tourism, visas, hotels), cars (carmakers, EVs, launches) or video games (games, studios, consoles, esports).
D = drop: politics, government, diplomacy, war, military, crime, courts, accidents, disasters, weather, health advice, education, memorials, religion, lifestyle or beauty tips, how-to guides, reviews, shopping deals, listicles, horoscopes, recipes, opinion or analysis columns, local or city-level news (a city, district or county project, local government notices, community or neighbourhood works, regional livelihood programmes), previews, explainers, live blogs, roundups.
U = unsure: only when it really cannot be judged. When in doubt between K and D, choose K. Items can be in any language.
Return JSON only, with one entry for EVERY item (${chunk.length} entries): {"r":{"1":"K","2":"D"}}
${chunk.map((r, k) => `${k + 1}. [${r.country}] ${r.title}${r.rss_summary ? " | " + r.rss_summary.replace(/\s+/g, " ").slice(0, 140) : ""}`).join("\n")}`;
    let res: { r?: Record<string, string> } = {};
    try { res = await cheapJSON(prompt); } catch (e) { log("screen:", (e as Error).message.slice(0, 120)); break; }
    const keep: number[] = [], unsure: number[] = [], drop: number[] = [];
    chunk.forEach((r, k) => {
      const d = String(res.r?.[String(k + 1)] ?? "").toUpperCase();
      if (r.type === "official" || d === "K") keep.push(r.id); else if (d === "D") drop.push(r.id); else unsure.push(r.id);
    });
    if (keep.length) await sql`update articles set screen = 'keep', screened_at = now() where id in ${sql(keep)}`;
    if (unsure.length) await sql`update articles set screen = 'unsure', screened_at = now() where id in ${sql(unsure)}`;
    if (drop.length) await sql`update articles set status = 'skipped', screen = 'drop', screened_at = now() where id in ${sql(drop)}`;
    dropped += drop.length;
  }
  log(`screen: ${rows.length} screened, ${dropped} dropped`);
  return { screened: rows.length, dropped };
}
