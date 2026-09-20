// Instagram (@thecodanews): one post every evening, guaranteed. Usually a news story as a 3-slide carousel; every third
// day a travel read instead (scenic photo + "what to look for"). If nothing meets the usual bar, the bar drops step by
// step so a day is never skipped. The long-lived token is kept in app_settings and refreshed weekly.
import { db } from "./db.ts";
import { env, log } from "./env.ts";
import { travelPhoto } from "./images.ts";
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

type Post = { id: number; slug: string; kind: string };
const slides = (p: Post) => p.kind === "travel"
  ? ["t1", "t2"].map((s) => `https://coda.news/event/${p.slug}/social?s=${s}&p=${p.id}&fmt=jpg`)
  : [1, 2, 3].map((s) => `https://coda.news/event/${p.slug}/social?s=${s}&fmt=jpg`);
const licensed = (c: string | null) => !!c && (/\/ (Pexels|Unsplash|Pixabay)$/.test(c) || /\((CC BY[^)]*|CC0[^)]*|Public domain|PDM)\)/i.test(c));
type Ev = { id: number; slug: string; title: string; summary: string; category: string; n: number; image_url: string | null; image_credit: string | null; image_query: string | null; lead_source: string | null; differ: string | null };

async function pickNews(recent: string[], minN: number, hours: number): Promise<Ev | undefined> {
  const [e] = await db()<Ev[]>`
    select e.id, e.slug, e.title, e.summary, e.category, (select count(*)::int from perspectives p where p.event_id = e.id) n, e.image_url, e.image_credit, e.image_query, e.lead_source,
      coalesce((select u.content->'differ'->>0 from event_updates u where u.event_id = e.id and u.type = 'summary_updated' order by u.version desc limit 1),
               (select p.emphasis from perspectives p where p.event_id = e.id and p.emphasis is not null order by p.article_count desc limit 1)) differ
    from events e
    where not e.hidden and e.summary is not null and e.category <> 'travel' and e.started_at > now() - make_interval(hours => ${hours})
      and (select count(*) from perspectives p where p.event_id = e.id) >= ${minN}
      and not exists (select 1 from ig_posts x where x.event_id = e.id)
    order by (e.category = any(${recent})), e.importance * power(0.5, extract(epoch from now() - e.started_at) / 86400) desc
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

/** 20:00 Melbourne: pick tonight's story and email the owner. */
export async function proposeInstagram(force = false): Promise<number> {
  const sql = db();
  await refreshToken().catch((e) => log("instagram refresh", (e as Error).message));
  if (!(await setting("ig_token"))) return 0;
  // 20:00 Melbourne, with 21:00 as a second chance if the first attempt failed
  if (!force && !["20", "21"].includes(melb({ hour: "numeric", hour12: false }))) return 0;
  if (!force && (await sql`select 1 from ig_posts where created_at > now() - interval '20 hours' and status <> 'failed'`).length) return 0;
  const recent = (await sql<{ category: string }[]>`select e.category from ig_posts p join events e on e.id = p.event_id order by p.id desc limit 2`).map((r) => r.category);
  // every third day a travel read, when there is a fresh one with a good photo
  const travelDue = !(await sql`select 1 from ig_posts where kind = 'travel' and created_at > now() - interval '60 hours'`).length;
  const t = travelDue ? await pickTravel() : undefined;
  // otherwise news; lower the bar step by step so the day is never skipped
  const e = t?.e ?? (await pickNews(recent, 3, 36)) ?? (await pickNews(recent, 2, 48)) ?? (await pickNews([], 1, 72));
  if (!e) { log("instagram: nothing to post tonight"); return 0; }
  const lead = (e.summary.match(/^.*?[.!?](\s|$)/)?.[0] ?? e.summary).trim();
  let caption: string;
  if (t) {
    caption = `${t.copy.title}\n\n${t.copy.dek}\n\nSwipe for what to look for →\nMore travel reads: link in bio\n📷 ${t.credit}${e.lead_source ? `\nVia ${e.lead_source}` : ""}\n\n#travel #travelinspiration #wanderlust #weekendescape #codanews`;
  } else {
    const credit = licensed(e.image_credit) ? `\n📷 ${e.image_credit}` : "";
    // a real caption: what happened, where the coverage differs, then the call to swipe
    const where = e.n > 1 ? `${e.n} countries, side by side. Swipe →\nFull comparison: link in bio` : `Swipe →\nFull story: link in bio`;
    caption = `${e.title}\n\n${lead}\n\n${e.differ && e.n > 1 ? `Where it differs: ${e.differ}\n\n` : ""}${where}${credit}\n\n${TAGS[e.category] ?? ""} #news #worldnews #codanews`;
  }
  const [p] = await sql<{ id: number; approve_token: string }[]>`insert into ig_posts (event_id, caption, kind, img_url, img_credit, copy) values (${e.id}, ${caption}, ${t ? "travel" : "news"}, ${t?.img ?? null}, ${t?.credit ?? null}, ${t ? sql.json(t.copy) : null}) returning id, approve_token`;
  const post: Post = { id: p.id, slug: e.slug, kind: t ? "travel" : "news" };
  const base = `${env("SUPABASE_URL")}/functions/v1/admin`;
  const ok = `${base}?ig=approve&t=${p.approve_token}`, no = `${base}?ig=skip&t=${p.approve_token}`;
  const to = env("REPORT_EMAIL"), key = env("RESEND_API_KEY");
  if (to && key) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "coda.news <hello@coda.news>", to: [to], subject: `Instagram 今晚待发：${t ? t.copy.title : e.title}`, html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px">
      <h2 style="margin:0 0 8px">今晚的 Instagram 帖子</h2><p style="color:#6B7280;margin:0 0 16px">已设为自动发布：这条会在几分钟内发到 @thecodanews。有问题请到 Instagram 删除，并告诉我原因。</p>
      <div>${slides(post).map((u) => `<img src="${u}" width="200" style="margin:0 6px 6px 0;border:1px solid #E5E7EB">`).join("")}</div>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#F4F5F7;padding:12px;border-radius:8px">${esc(caption)}</pre>
      <p><a href="${ok}" style="display:inline-block;background:#EA5514;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">发布</a>
      &nbsp; <a href="${no}" style="color:#6B7280">跳过今晚</a> &nbsp; <a href="https://coda.news/event/${e.slug}" style="color:#6B7280">查看原文页</a></p></div>` }) });
  log(`instagram: proposed ${e.slug}`);
  // owner switched to hands-off posting (app_settings ig_auto = 1): publish straight away; the email above is then just a notice
  if ((await setting("ig_auto")) === "1") { await sql`update ig_posts set status = 'approved' where id = ${p.id}`; await publishInstagram(p.id).catch((x) => log("instagram publish", (x as Error).message)); }
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

/** Publish an approved post as a carousel. */
export async function publishInstagram(postId: number): Promise<string> {
  const sql = db();
  const [p] = await sql<(Post & { caption: string })[]>`select p.id, e.slug, p.caption, p.kind from ig_posts p join events e on e.id = p.event_id where p.id = ${postId}`;
  const token = await setting("ig_token"), user = await setting("ig_user_id");
  if (!p || !token || !user) throw new Error("post or token missing");
  const post = async (path: string, body: Record<string, string>) => {
    const j = await (await fetch(`${G}/${path}`, { method: "POST", body: new URLSearchParams({ ...body, access_token: token }) })).json();
    if (!j.id) throw new Error(`${path}: ${JSON.stringify(j.error ?? j).slice(0, 200)}`);
    return j.id as string;
  };
  try {
    // warm the image cache first (each slide renders in a few seconds), then create the items together
    await Promise.all(slides(p).map((u) => fetch(u).then((r) => r.arrayBuffer()).catch(() => null)));
    const kids = await Promise.all(slides(p).map((u) => post(`${user}/media`, { image_url: u, is_carousel_item: "true" })));
    await Promise.all(kids.map((k) => waitReady(k, token)));
    const box = await post(`${user}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption: p.caption });
    await waitReady(box, token);
    const media = await post(`${user}/media_publish`, { creation_id: box });
    const link = (await (await fetch(`${G}/${media}?fields=permalink&access_token=${token}`)).json()).permalink ?? null;
    await sql`update ig_posts set status = 'posted', media_id = ${media}, permalink = ${link}, posted_at = now(), error = null where id = ${postId}`;
    return link ?? "posted";
  } catch (e) {
    await sql`update ig_posts set status = 'failed', error = ${(e as Error).message} where id = ${postId}`;
    throw e;
  }
}
