// Instagram (@thecodanews): every evening propose one story as a 3-slide carousel, email the owner a preview with an
// approve link, and publish only after approval. The long-lived token is kept in app_settings and refreshed weekly.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

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

const slides = (slug: string) => [1, 2, 3].map((s) => `https://coda.news/event/${slug}/social?s=${s}&fmt=jpg`);

/** 20:00 Melbourne: pick tonight's story and email the owner. */
export async function proposeInstagram(force = false): Promise<number> {
  const sql = db();
  await refreshToken().catch((e) => log("instagram refresh", (e as Error).message));
  if (!(await setting("ig_token"))) return 0;
  if (!force && melb({ hour: "numeric", hour12: false }) !== "20") return 0;
  if (!force && (await sql`select 1 from ig_posts where created_at > now() - interval '20 hours'`).length) return 0;
  const recent = (await sql<{ category: string }[]>`select e.category from ig_posts p join events e on e.id = p.event_id order by p.id desc limit 2`).map((r) => r.category);
  const [e] = await sql<{ id: number; slug: string; title: string; category: string; n: number; image_credit: string | null }[]>`
    select e.id, e.slug, e.title, e.category, (select count(*)::int from perspectives p where p.event_id = e.id) n, e.image_credit
    from events e
    where not e.hidden and e.summary is not null and e.started_at > now() - interval '36 hours'
      and (select count(*) from perspectives p where p.event_id = e.id) >= 3
      and not exists (select 1 from ig_posts x where x.event_id = e.id)
    order by (e.category = any(${recent})) , e.importance * power(0.5, extract(epoch from now() - e.started_at) / 86400) desc
    limit 1`;
  if (!e) { log("instagram: no suitable story tonight"); return 0; }
  const credit = e.image_credit && /(Pexels|Unsplash|Pixabay|CC BY|CC0|Public domain)/i.test(e.image_credit) ? `\nPhoto: ${e.image_credit}` : "";
  const caption = `${e.title}\n\nOne story, ${e.n} countries: what every report shares and where the coverage differs. Swipe →\n\nFull comparison: link in bio (coda.news)${credit}\n\n${TAGS[e.category] ?? ""} #news #worldnews #globalnews #codanews`;
  const [p] = await sql<{ id: number; approve_token: string }[]>`insert into ig_posts (event_id, caption) values (${e.id}, ${caption}) returning id, approve_token`;
  const base = `${env("SUPABASE_URL")}/functions/v1/admin`;
  const ok = `${base}?ig=approve&t=${p.approve_token}`, no = `${base}?ig=skip&t=${p.approve_token}`;
  const to = env("REPORT_EMAIL"), key = env("RESEND_API_KEY");
  if (to && key) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "coda.news <hello@coda.news>", to: [to], subject: `Instagram 今晚待发：${e.title}`, html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px">
      <h2 style="margin:0 0 8px">今晚的 Instagram 帖子</h2><p style="color:#6B7280;margin:0 0 16px">已设为自动发布：这条会在几分钟内发到 @thecodanews。有问题请到 Instagram 删除，并告诉我原因。</p>
      <div>${slides(e.slug).map((u) => `<img src="${u}" width="200" style="margin:0 6px 6px 0;border:1px solid #E5E7EB">`).join("")}</div>
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
  const [p] = await sql<{ slug: string; caption: string }[]>`select e.slug, p.caption from ig_posts p join events e on e.id = p.event_id where p.id = ${postId}`;
  const token = await setting("ig_token"), user = await setting("ig_user_id");
  if (!p || !token || !user) throw new Error("post or token missing");
  const post = async (path: string, body: Record<string, string>) => {
    const j = await (await fetch(`${G}/${path}`, { method: "POST", body: new URLSearchParams({ ...body, access_token: token }) })).json();
    if (!j.id) throw new Error(`${path}: ${JSON.stringify(j.error ?? j).slice(0, 200)}`);
    return j.id as string;
  };
  try {
    // warm the image cache first (each slide renders in a few seconds), then create the three items together
    await Promise.all(slides(p.slug).map((u) => fetch(u).then((r) => r.arrayBuffer()).catch(() => null)));
    const kids = await Promise.all(slides(p.slug).map((u) => post(`${user}/media`, { image_url: u, is_carousel_item: "true" })));
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
