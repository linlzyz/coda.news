// Instagram (@thecodanews): one post every evening, guaranteed. Usually a news story as a 3-slide carousel; every third
// day a travel read instead (scenic photo + "what to look for"). If nothing meets the usual bar, the bar drops step by
// step so a day is never skipped. News days alternate between a carousel and a Reel (the same slides as a 9:16 video,
// rendered by the site at /api/ig/reel/<id>; Instagram processes it in the background and a later tick publishes it).
// Every post is followed by a Story pointing to it. The long-lived token is kept in app_settings and refreshed weekly.
import { db } from "./db.ts";
import { env, log } from "./env.ts";
import { travelPhoto } from "./images.ts";
import { sourceEn } from "./source-names.ts";
import { cheapJSON } from "./ai.ts";
import { fetchText } from "./text.ts";

const G = "https://graph.instagram.com/v23.0";
const TAGS: Record<string, string> = { technology: "#tech", economy: "#economy #markets", sport: "#sport", entertainment: "#entertainment", fashion: "#fashion", travel: "#travel", automotive: "#cars", gaming: "#gaming" };
const esc = (s: unknown) => String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
const melb = (o: Intl.DateTimeFormatOptions) => new Date().toLocaleString("en-CA", { timeZone: "Australia/Melbourne", ...o });

async function setting(k: string) { const [r] = await db()<{ value: string }[]>`select value from app_settings where key = ${k}`; return r?.value ?? null; }

async function refreshToken() {
  const sql = db();
  const [r] = await sql<{ value: string; old: boolean }[]>`select value, updated_at < now() - interval '7 days' as old from app_settings where key = 'ig_token'`;
  if (!r?.old) return;
  const j = await (await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${r.value}`)).json();
  if (j.access_token) { await sql`update app_settings set value = ${j.access_token}, updated_at = now() where key = 'ig_token'`; log("instagram: token refreshed"); }
  else log("instagram: token refresh failed", JSON.stringify(j).slice(0, 160));
}

type Post = { id: number; slug: string; kind: string; format?: string; n?: number };
const reelUrl = (id: number) => `https://coda.news/api/ig/reel/${id}.mp4`;
const launchUrl = (id: number, s: string) => `https://coda.news/api/ig/launches/${id}?s=${s}&fmt=jpg`;
const storyUrl = (p: Post) => p.kind === "launches" ? launchUrl(p.id, "story") : `https://coda.news/event/${p.slug}/social?s=story&p=${p.id}&fmt=jpg`;
const slides = (p: Post) => p.kind === "launches"
  ? ["0", ...Array.from({ length: p.n ?? 0 }, (_, i) => String(i + 1))].map((s) => launchUrl(p.id, s))
  : p.kind === "travel"
  ? ["t1", "t2"].map((s) => `https://coda.news/event/${p.slug}/social?s=${s}&p=${p.id}&fmt=jpg`)
  : [1, 2, 3].map((s) => `https://coda.news/event/${p.slug}/social?s=${s}&fmt=jpg`);
const licensed = (c: string | null) => !!c && (/\/ (Pexels|Unsplash|Pixabay)$/.test(c) || /\((CC BY[^)]*|CC0[^)]*|Public domain|PDM)\)/i.test(c));
type Ev = { id: number; slug: string; title: string; summary: string; category: string; n: number; image_url: string | null; image_credit: string | null; image_query: string | null; lead_source: string | null; differ: string | null };

// Instagram is the brand's face: never post bad-luck news (death, illness, disaster, violence). Checked on title + summary.
const GRIM = "\\m(die[sd]?|dying|death|dead|deaths|killed|kills?|fatal|funeral|obituar\\w*|passe[sd] away|mourn\\w*|suicide|overdose|rehab\\w*|cancer|illness|hospitali[sz]ed|coma|crash\\w*|accident\\w*|collapse[sd]?|disaster|earthquake|tsunami|flood\\w*|wildfire|hurricane|typhoon|cyclone|explosion|blast|missile|strike[sd]? on|attack\\w*|shooting|stabb\\w*|bomb\\w*|terror\\w*|hostage|massacre|victims?|injur\\w*|tragic|tragedy)\\M";

// match results and race placings, by title (scores, beat/draw/lose, wins, finals, medals, pole, tries...)
const SPORT_RESULT = "(\\d+\\s*[-–:]\\s*\\d+|\\m(beat|beats|beaten|defeat|defeats|defeated|draw|draws|drew|lose|loses|lost|edge|edges|edged|thrash\\w*|rout\\w*|victory|victories|qualif\\w*|semi-?finals?|quarter-?finals?|finals?|sprint|pole|podium|innings|wickets?|try|tries|brace|hat-?trick|sent off|red card|win|wins|won|retains?|retained|advances?|reach|reaches|silver|bronze|medal)\\M)";

// ...except the champions of the very biggest competitions (Lyn: "世界杯冠军、欧冠冠军也可以发")
const BIG_TITLE = "(world cup|champions league|euro 20\\d\\d|european championship|copa am[eé]rica|africa cup of nations|asian cup|super bowl|nba finals|nba champion|world series|stanley cup|wimbledon|roland[- ]garros|french open|australian open|us open tennis|tour de france|f1 world (champion|title)|formula 1 world (champion|title)|ballon d'or|rugby world cup|cricket world cup)";
const CROWNED = "\\m(win|wins|won|champions?|crowned|lift|lifts|lifted|title|trophy|clinch\\w*|claims?|claimed)\\M";
// and results that make history (Lyn: "载入史册的"): first ever, historic, all-time, world record
const HISTORIC = "\\m(historic|history|history-making|first[- ]ever|for the first time|all-time|world record|unprecedented|record-breaking|record[- ]extending|record \\d+(st|nd|rd|th))\\M";
const NOT_FINAL = "\\m(qualif\\w*|qualifier|group|groups|round of|last 16|quarter-?finals?|semi-?finals?|matchday|league phase|draw for|playoff|play-off)\\M";

async function pickNews(recent: string[], minN: number, hours: number, onlyId: number | null = null): Promise<Ev | undefined> {
  const [e] = await db()<Ev[]>`
    select e.id, e.slug, e.title, e.summary, e.category, (select count(*)::int from perspectives p where p.event_id = e.id) n, e.image_url, e.image_credit, e.image_query, e.lead_source,
      coalesce((select u.content->'differ'->>0 from event_updates u where u.event_id = e.id and u.type = 'summary_updated' order by u.version desc limit 1),
               (select p.emphasis from perspectives p where p.event_id = e.id and p.emphasis is not null order by p.article_count desc limit 1)) differ
    from events e
    where not e.hidden and e.summary is not null and e.category <> 'travel' and e.started_at > now() - make_interval(hours => ${hours})
      -- sport only for big non-result news (transfers, sponsorships, records, Games openings) in 3+ countries: scores are stale by 20:00 (Lyn, 21 Sept)
      and (e.category <> 'sport' or ((select count(*) from perspectives p where p.event_id = e.id) >= 3 and (e.title !~* ${SPORT_RESULT} or e.title ~* ${HISTORIC} or (e.title ~* ${BIG_TITLE} and e.title ~* ${CROWNED} and e.title !~* ${NOT_FINAL}))))
      and (e.title || ' ' || e.summary) !~* ${GRIM}
      and (select count(*) from perspectives p where p.event_id = e.id) >= ${minN}
      and not exists (select 1 from ig_posts x where x.event_id = e.id)
      and (${onlyId}::bigint is null or e.id = ${onlyId})
    -- the day's big story: most countries first, then importance (a 3-country niche item must not beat a 5-country derby)
    order by (e.category = any(${recent})), (select count(*) from perspectives p where p.event_id = e.id) desc, e.importance * power(0.5, extract(epoch from now() - e.started_at) / 86400) desc
    limit 1`;
  return e;
}

type Copy = { title: string; dek: string; items: { h: string; d: string }[]; title_zh: string; dek_zh: string; items_zh: { h: string; d: string }[] };
/** Magazine-style copy for a travel post, strictly from the source article (the Devon post is the model). */
async function travelCopy(e: Ev): Promise<Copy | null> {
  const [a] = await db()<{ url: string; text: string | null; rss: string | null }[]>`select url, full_text text, rss_summary rss from articles where event_id = ${e.id} order by published_at desc limit 1`;
  const text = a?.text ?? (a ? await fetchText(a.url).catch(() => null) : null) ?? a?.rss ?? e.summary;
  const prompt = `Write copy for an Instagram travel carousel from this article. Use ONLY facts in the article; never invent places, names or numbers.
Return JSON only: {"title":"inviting headline, max 40 characters, no outlet name, e.g. \"Devon, beyond the beaches\"","dek":"one line, max 90 characters, what makes it worth going","items":[{"h":"2-4 word name of a thing to see, do or stay","d":"max 55 characters, a concrete detail"}],"title_zh":"same in natural Simplified Chinese","dek_zh":"...","items_zh":[{"h":"...","d":"..."}]}
items: 3 to 5, each a real, specific thing from the article. If the article has fewer than 3, return fewer.
Headline: ${e.title}
Article:
${String(text).slice(0, 5000)}`;
  try {
    const c = await cheapJSON<Copy>(prompt);
    if (!c?.title || !Array.isArray(c.items) || c.items.length < 2) return null;
    c.items = c.items.slice(0, 5); c.items_zh = (c.items_zh ?? []).slice(0, 5);
    return c;
  } catch { return null; }
}

async function pickTravel(): Promise<{ e: Ev; img: string; credit: string; copy: Copy } | undefined> {
  const rows = await db()<Ev[]>`
    select e.id, e.slug, e.title, e.summary, e.category, 0 n, e.image_url, e.image_credit, e.image_query, e.lead_source, null differ
    from events e
    where not e.hidden and e.summary is not null and e.category = 'travel' and e.started_at > now() - interval '7 days'
      -- a different country from the last travel post (magazines run themed weeks, e.g. a whole week of Japan)
      and not (coalesce(e.regions, '{}') && coalesce((select e2.regions from ig_posts p2 join events e2 on e2.id = p2.event_id where p2.kind = 'travel' and p2.status = 'posted' order by p2.id desc limit 1), '{}'))
      and (e.title || ' ' || e.summary) !~* ${GRIM}
      and not exists (select 1 from ig_posts x where x.event_id = e.id)
      and (e.image_query is not null and e.image_query <> '-' or e.image_credit is not null)
      -- inspiration, not industry news: skip airline, airport and fleet stories
      and e.title !~* '(airline|airways|airport|flight|aircraft|a3[2-5]\\d|boeing|airbus|fleet|route|lounge)' and coalesce(e.image_query, '') !~* '(airline|flight|airport|aircraft|cabin)'
    order by (e.points is not null) desc, e.importance desc, e.started_at desc limit 5`;
  for (const e of rows) {
    const ph = licensed(e.image_credit) && e.image_url ? { url: e.image_url, credit: e.image_credit! } : await travelPhoto(e.image_query ?? "").catch(() => null);
    if (!ph) continue;
    const copy = await travelCopy(e);
    if (copy) return { e, img: ph.url, credit: ph.credit, copy };
  }
}

// Sunday roundup "This week's launches" (Lyn, 27 Sept): the week's product launches, one per slide, typographic
// (publishers' photos are not ours to post; only Wikimedia Commons pictures go on a slide). Same rules as the site's
// New launches box: a launch word in the title, not a leak/rumour/update, never bad news.
const LAUNCH = /\b(launch(es|ed)?|unveil(s|ed)?|reveal(s|ed)?|debut(s|ed)?|introduc(es|ed)|releases?|released|arrives?|goes on sale|premier(es|ed)|presents?)\b/i;
const NOT_PRODUCT = /\b(leak(s|ed)?|rumou?rs?|report(s|ed)?|teases?|teaser|requirements|benchmark|campaign|licen[cs]e|share|record|details|states|says|pricing|price cut|recall|delay(s|ed)?|app|apps|service|platform|update|version|beta|feature|features|preview|developer|open-source|crowdfunding|translation|model|models|architecture|trial|pilot|partnership|plans?|investment)\b/i;
type Launch = { slug: string; cat: string; name: string; brand: string; line: string; countries: string[]; sources: number; img: string | null; credit: string | null };

async function pickLaunches(): Promise<{ first: number; week: string; items: Launch[] } | undefined> {
  const sql = db();
  const rows = await sql<{ id: number; slug: string; title: string; summary: string; category: string; countries: string[]; source_count: number; image_url: string | null; image_credit: string | null; image_source: string | null }[]>`
    select id, slug, title, summary, category, countries, source_count, image_url, image_credit, image_source from events
    where not hidden and summary is not null and category in ('technology','automotive','gaming','fashion')
      and started_at > now() - interval '7 days' and (title || ' ' || summary) !~* ${GRIM}
    order by coalesce(array_length(countries, 1), 0) desc, source_count desc limit 300`;
  const picked: typeof rows = [];
  for (const e of rows) {
    if (!LAUNCH.test(e.title) || NOT_PRODUCT.test(e.title)) continue;
    if (picked.filter((x) => x.category === e.category).length >= 2) continue;   // a mix of sections, not six phones
    picked.push(e); if (picked.length >= 6) break;
  }
  if (picked.length < 4) return undefined;
  // short product name, maker and one line on what is new, from our own summaries (the model may not invent facts)
  const res = await cheapJSON<{ items: { i: number; name: string; brand: string; line: string }[] }>(`For an Instagram roundup of this week's product launches, write for each item below:
- "name": the product's name only, as short as possible (max 32 characters, e.g. "Bentley Torcal", "Galaxy Tab S11"). No verbs.
- "brand": the company that makes it (max 24 characters).
- "line": one plain sentence, max 90 characters, on what is new about it. Only facts in the text. No hype words, no emoji, no dashes.
Return JSON {"items":[{"i":0,"name":"","brand":"","line":""}]}.

${picked.map((e, i) => `${i}. ${e.title}\n${e.summary}`).join("\n\n")}`);
  const byI = new Map((res?.items ?? []).map((x) => [Number(x.i), x]));
  const items: Launch[] = picked.map((e, i) => {
    const x = byI.get(i);
    const pic = e.image_source === "commons" && e.image_url && e.image_credit ? { img: e.image_url, credit: e.image_credit } : { img: null, credit: null };
    return { slug: e.slug, cat: e.category, name: (x?.name || e.title).slice(0, 40), brand: (x?.brand ?? "").slice(0, 30), line: (x?.line || (e.summary.match(/^.*?[.!?](\s|$)/)?.[0] ?? e.summary)).replace(/\s*[—–]\s*/g, ", ").slice(0, 120),
      countries: e.countries ?? [], sources: e.source_count, ...pic };
  });
  const d = (n: number) => new Date(Date.now() - n * 86400_000).toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short" });
  return { first: picked[0].id, week: `${d(6)} to ${d(0)}`.toUpperCase(), items };
}

/** 20:00 Melbourne: pick tonight's story and email the owner. */
export async function proposeInstagram(force = false, eventId: number | null = null): Promise<number> {
  const sql = db();
  await refreshToken().catch((e) => log("instagram refresh", (e as Error).message));
  if (!(await setting("ig_token"))) return 0;
  // 20:00 Melbourne, with 21:00 as a second chance if the first attempt failed
  if (!force && !["20", "21"].includes(melb({ hour: "numeric", hour12: false }))) return 0;
  if (!force && (await sql`select 1 from ig_posts where created_at > now() - interval '20 hours' and status <> 'failed'`).length) return 0;
  // Sundays: the week's launches instead of a single story (falls back to the usual post if the week had too few)
  if (!eventId && melb({ weekday: "short" }).startsWith("Sun") && !(await sql`select 1 from ig_posts where kind = 'launches' and created_at > now() - interval '6 days' and status <> 'failed'`).length) {
    const w = await pickLaunches().catch((x) => { log("instagram launches", (x as Error).message); return undefined; });
    if (w) return await proposeLaunches(w);
  }
  const recent = (await sql<{ category: string }[]>`select e.category from ig_posts p join events e on e.id = p.event_id order by p.id desc limit 2`).map((r) => r.category);
  // every third day a travel read, when there is a fresh one with a good photo
  const travelDue = !(await sql`select 1 from ig_posts where kind = 'travel' and created_at > now() - interval '60 hours'`).length;
  const t = travelDue && !eventId ? await pickTravel() : undefined;
  // otherwise news; lower the bar step by step so the day is never skipped
  const e = t?.e ?? (eventId ? await pickNews([], 1, 72, eventId) : undefined) ?? (await pickNews(recent, 3, 36)) ?? (await pickNews(recent, 2, 48)) ?? (await pickNews([], 1, 72));
  if (!e) { log("instagram: nothing to post tonight"); return 0; }
  const lead = (e.summary.match(/^.*?[.!?](\s|$)/)?.[0] ?? e.summary).trim();
  // news days alternate carousel / Reel
  const [lastNews] = await sql<{ format: string }[]>`select format from ig_posts where kind = 'news' and status = 'posted' order by id desc limit 1`;
  const format = !t && lastNews?.format === "carousel" ? "reel" : "carousel";
  let caption: string;
  if (t) {
    caption = `${t.copy.title}\n\n${t.copy.dek}\n\nSwipe for what to look for →\nMore travel reads: link in bio\n📷 ${t.credit}${e.lead_source ? `\nVia ${sourceEn(e.lead_source)}` : ""}\n\n#travel #travelinspiration #wanderlust #weekendescape #codanews`;
  } else {
    const credit = licensed(e.image_credit) ? `\n📷 ${e.image_credit}` : "";
    // a real caption: what happened, where the coverage differs, then the call to swipe
    const swipe = format === "reel" ? "" : " Swipe →";
    const where = e.n > 1 ? `${e.n} countries, side by side.${swipe}\nFull comparison: link in bio` : `${swipe.trim() ? "Swipe →\n" : ""}Full story: link in bio`;
    caption = `${e.title}\n\n${lead}\n\n${e.differ && e.n > 1 ? `Where it differs: ${e.differ}\n\n` : ""}${where}${credit}\n\n${TAGS[e.category] ?? ""} #news #worldnews #codanews`;
  }
  const [p] = await sql<{ id: number; approve_token: string }[]>`insert into ig_posts (event_id, caption, kind, format, img_url, img_credit, copy) values (${e.id}, ${caption}, ${t ? "travel" : "news"}, ${format}, ${t?.img ?? null}, ${t?.credit ?? null}, ${t ? sql.json(t.copy) : null}) returning id, approve_token`;
  const post: Post = { id: p.id, slug: e.slug, kind: t ? "travel" : "news", format };
  const base = `${env("SUPABASE_URL")}/functions/v1/admin`;
  const ok = `${base}?ig=approve&t=${p.approve_token}`, no = `${base}?ig=skip&t=${p.approve_token}`;
  const to = env("REPORT_EMAIL"), key = env("RESEND_API_KEY");
  const auto = (await setting("ig_auto")) === "1";   // auto-posting: no approve/skip buttons (they could not work anyway: Supabase shows function HTML as plain text)
  if (to && key) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "coda.news <hello@coda.news>", to: [to], subject: `Instagram 今晚待发：${t ? t.copy.title : e.title}`, html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px">
      <h2 style="margin:0 0 8px">今晚的 Instagram ${format === "reel" ? "Reel" : "帖子"}</h2><p style="color:#6B7280;margin:0 0 16px">已设为自动发布：这条会在几分钟内发到 @thecodanews。有问题请到 Instagram 删除，并告诉我原因。</p>
      <p style="margin:0 0 10px;font-weight:700">${format === "reel"
        ? `形式：Reel（约 13 秒的竖版视频）。下面 ${slides(post).length} 张是视频里依次出现的画面，不是图片帖。 <a href="${reelUrl(p.id)}" style="color:#EA5514">播放视频预览 ▶</a>`
        : `形式：轮播图帖子，共 ${slides(post).length} 张，左右滑动看。`}</p>
      <div>${slides(post).map((u) => `<img src="${u}" width="200" style="margin:0 6px 6px 0;border:1px solid #E5E7EB">`).join("")}</div>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#F4F5F7;padding:12px;border-radius:8px">${esc(caption)}</pre>
      ${auto ? `<p style="color:#6B7280">这条会自动发出，不用点任何按钮。 <a href="https://www.instagram.com/thecodanews/" style="color:#EA5514">去 Instagram 看</a> &nbsp; <a href="https://coda.news/event/${e.slug}" style="color:#6B7280">查看原文页</a></p>`
        : `<p><a href="${ok}" style="display:inline-block;background:#EA5514;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">发布</a>
      &nbsp; <a href="${no}" style="color:#6B7280">跳过今晚</a> &nbsp; <a href="https://coda.news/event/${e.slug}" style="color:#6B7280">查看原文页</a></p>`}</div>` }) });
  log(`instagram: proposed ${e.slug}`);
  // owner switched to hands-off posting (app_settings ig_auto = 1): publish straight away; the email above is then just a notice
  if ((await setting("ig_auto")) === "1") { await sql`update ig_posts set status = 'approved' where id = ${p.id}`; await publishInstagram(p.id).catch((x) => log("instagram publish", (x as Error).message)); }
  return 1;
}

async function proposeLaunches(w: { first: number; week: string; items: Launch[] }): Promise<number> {
  const sql = db();
  const tags = [...new Set(w.items.map((x) => TAGS[x.cat] ?? ""))].join(" ");
  const caption = `This week's launches, ${w.week.toLowerCase()}\n\n${w.items.map((x, i) => `${i + 1}. ${x.name}${x.brand && !x.name.toLowerCase().includes(x.brand.toLowerCase()) ? ` (${x.brand})` : ""}: ${x.line}`).join("\n")}\n\nSwipe →\nEvery launch, with how each country covered it: link in bio\n\n${tags} #newlaunch #newproduct #codanews`;
  const [p] = await sql<{ id: number }[]>`insert into ig_posts (event_id, caption, kind, format, copy) values (${w.first}, ${caption}, 'launches', 'carousel', ${sql.json({ week: w.week, items: w.items })}) returning id`;
  const post: Post = { id: p.id, slug: "", kind: "launches", format: "carousel", n: w.items.length };
  const to = env("REPORT_EMAIL"), key = env("RESEND_API_KEY");
  const auto = (await setting("ig_auto")) === "1";
  if (to && key) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "coda.news <hello@coda.news>", to: [to], subject: `Instagram 今晚待发：本周新品（${w.items.length} 款）`, html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px">
      <h2 style="margin:0 0 8px">今晚的 Instagram：本周新品合集</h2><p style="color:#6B7280;margin:0 0 16px">${auto ? "已设为自动发布，几分钟内发到 @thecodanews。有问题请到 Instagram 删除，并告诉我原因。" : "还没开自动发布，这条不会自己发出。"}</p>
      <p style="margin:0 0 10px;font-weight:700">形式：轮播图帖子，共 ${slides(post).length} 张。</p>
      <div>${slides(post).map((u) => `<img src="${u}" width="200" style="margin:0 6px 6px 0;border:1px solid #E5E7EB">`).join("")}</div>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#F4F5F7;padding:12px;border-radius:8px">${esc(caption)}</pre></div>` }) });
  log(`instagram: launches roundup ${w.items.length}`);
  if (auto) { await sql`update ig_posts set status = 'approved' where id = ${p.id}`; await publishInstagram(p.id).catch((x) => log("instagram publish", (x as Error).message)); }
  return 1;
}

async function waitReady(id: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const j = await (await fetch(`${G}/${id}?fields=status_code&access_token=${token}`)).json();
    if (j.status_code === "FINISHED") return;
    if (j.status_code === "ERROR" || j.status_code === "EXPIRED") throw new Error(`container ${j.status_code}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("container not ready in time");
}

async function api() {
  const token = await setting("ig_token"), user = await setting("ig_user_id");
  if (!token || !user) throw new Error("token missing");
  const post = async (path: string, body: Record<string, string>) => {
    const j = await (await fetch(`${G}/${path}`, { method: "POST", body: new URLSearchParams({ ...body, access_token: token }) })).json();
    if (!j.id) throw new Error(`${path}: ${JSON.stringify(j.error ?? j).slice(0, 200)}`);
    return j.id as string;
  };
  const status = async (id: string) => (await (await fetch(`${G}/${id}?fields=status_code&access_token=${token}`)).json()).status_code as string | undefined;
  const permalink = async (id: string) => (await (await fetch(`${G}/${id}?fields=permalink&access_token=${token}`)).json()).permalink ?? null;
  return { token, user, post, status, permalink };
}

async function loadPost(postId: number) {
  const [p] = await db()<(Post & { caption: string; container_id: string | null; created_at: Date })[]>`select p.id, e.slug, p.caption, p.kind, p.format, p.container_id, p.created_at, coalesce(jsonb_array_length(p.copy->'items'), 0)::int as n from ig_posts p join events e on e.id = p.event_id where p.id = ${postId}`;
  if (!p) throw new Error("post missing");
  return p;
}

/** A Story pointing to the post that just went out. Never fails the post itself. */
async function postStory(p: Post) {
  try {
    const a = await api();
    await fetch(storyUrl(p)).then((r) => r.arrayBuffer()).catch(() => null);
    const box = await a.post(`${a.user}/media`, { media_type: "STORIES", image_url: storyUrl(p) });
    await waitReady(box, a.token);
    const id = await a.post(`${a.user}/media_publish`, { creation_id: box });
    await db()`update ig_posts set story_id = ${id} where id = ${p.id}`;
  } catch (e) { log("instagram story", (e as Error).message); }
}

async function publishCarousel(p: Post & { caption: string }): Promise<string> {
  const sql = db(), a = await api();
  // warm the image cache first (each slide renders in a few seconds), then create the items together
  await Promise.all(slides(p).map((u) => fetch(u).then((r) => r.arrayBuffer()).catch(() => null)));
  const kids = await Promise.all(slides(p).map((u) => a.post(`${a.user}/media`, { image_url: u, is_carousel_item: "true" })));
  await Promise.all(kids.map((k) => waitReady(k, a.token)));
  const box = await a.post(`${a.user}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption: p.caption });
  await waitReady(box, a.token);
  const media = await a.post(`${a.user}/media_publish`, { creation_id: box });
  const link = await a.permalink(media);
  await sql`update ig_posts set status = 'posted', format = 'carousel', media_id = ${media}, permalink = ${link}, posted_at = now(), error = null where id = ${p.id}`;
  await postStory(p);
  return link ?? "posted";
}

/** Publish an approved post: a carousel right away, or start a Reel (finished by finishReels on a later tick). */
export async function publishInstagram(postId: number): Promise<string> {
  const sql = db();
  const p = await loadPost(postId);
  try {
    if (p.format === "reel") {
      try {
        const a = await api();
        // the site renders the video (15-20 s); Instagram gets a static copy from our storage, since it gives up on slow URLs
        const r = await fetch(reelUrl(p.id), { signal: AbortSignal.timeout(110_000) });
        if (!r.ok || !(r.headers.get("content-type") ?? "").startsWith("video/")) throw new Error(`reel render ${r.status}`);
        const base = env("SUPABASE_URL"), secret = env("SUPABASE_SERVICE_ROLE_KEY"), file = `ig/reel-${p.id}.mp4`;
        const up = await fetch(`${base}/storage/v1/object/images/${file}`, { method: "POST", headers: { apikey: secret, Authorization: `Bearer ${secret}`, "content-type": "video/mp4", "x-upsert": "true" }, body: await r.arrayBuffer() });
        if (!up.ok) throw new Error(`reel upload ${up.status}`);
        const box = await a.post(`${a.user}/media`, { media_type: "REELS", video_url: `${base}/storage/v1/object/public/images/${file}`, cover_url: slides(p)[0], caption: p.caption, share_to_feed: "true" });
        await sql`update ig_posts set status = 'processing', container_id = ${box}, error = null where id = ${p.id}`;
        return "processing";
      } catch (e) {
        // a Reel that cannot start still goes out today, as a carousel
        log("instagram reel → carousel", (e as Error).message);
        return await publishCarousel({ ...p, caption: p.caption.replace("side by side.\n", "side by side. Swipe →\n") });
      }
    }
    return await publishCarousel(p);
  } catch (e) {
    await sql`update ig_posts set status = 'failed', error = ${(e as Error).message} where id = ${postId}`;
    throw e;
  }
}

/** Every tick: publish Reels whose video Instagram has finished processing; fall back to a carousel if it errors or stalls. */
export async function finishReels(): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number }[]>`select id from ig_posts where status = 'processing' and container_id is not null`;
  let n = 0;
  for (const { id } of rows) {
    const p = await loadPost(id);
    try {
      const a = await api();
      const st = await a.status(p.container_id!);
      const stale = Date.now() - new Date(p.created_at).getTime() > 45 * 60_000;
      if (st === "FINISHED") {
        const media = await a.post(`${a.user}/media_publish`, { creation_id: p.container_id! });
        await sql`update ig_posts set status = 'posted', media_id = ${media}, permalink = ${await a.permalink(media)}, posted_at = now(), error = null where id = ${id}`;
        await postStory(p);
        n++;
      } else if (st === "ERROR" || st === "EXPIRED" || stale) {
        log(`instagram reel ${id}: ${st ?? "no status"}${stale ? " (stalled)" : ""} → carousel`);
        await publishCarousel({ ...p, caption: p.caption.replace("side by side.\n", "side by side. Swipe →\n") });
        n++;
      }
    } catch (e) {
      await sql`update ig_posts set status = 'failed', error = ${(e as Error).message} where id = ${id}`;
      log("instagram finish", (e as Error).message);
    }
  }
  return n;
}
