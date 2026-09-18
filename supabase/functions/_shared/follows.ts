// Follow a company or topic by email: double opt-in, then one digest a day with new events (sent with the morning brief).
import { db } from "./db.ts";
import { log } from "./env.ts";
import { esc, send, shell } from "./newsletter.ts";

const SITE = "https://coda.news";
type F = { id: number; email: string; lang: string; token: string; company_id: number | null; topic_id: number | null; name: string; name_zh: string | null; slug: string; last_sent_at: string | null };

const pageOf = (f: F) => `${SITE}${f.lang === "zh" ? "/zh" : ""}/${f.company_id ? "company" : "topic"}/${f.slug}`;

async function rows(where: "confirm" | "alert") {
  const sql = db();
  return sql<F[]>`
    select f.id, f.email, f.lang, f.token::text, f.company_id, f.topic_id, f.last_sent_at,
           coalesce(c.name, t.name) as name, c.name_zh, coalesce(c.slug, t.slug) as slug
    from follows f left join companies c on c.id = f.company_id left join topics t on t.id = f.topic_id
    where f.unsubscribed_at is null and ${where === "confirm" ? sql`f.confirmed_at is null and f.confirm_sent_at is null` : sql`f.confirmed_at is not null and (f.last_sent_at is null or f.last_sent_at < now() - interval '20 hours')`}
    order by f.id limit 200`;
}

export async function sendFollowConfirmations(): Promise<number> {
  const sql = db();
  const list = await rows("confirm");
  if (!list.length) return 0;
  const n = await send(list.slice(0, 50).map((f) => {
    const zh = f.lang === "zh"; const label = zh && f.name_zh ? f.name_zh : f.name;
    const ok = `${SITE}${zh ? "/zh" : ""}/follow?t=${f.token}&a=confirm`, unsub = `${SITE}${zh ? "/zh" : ""}/follow?t=${f.token}&a=stop`;
    const body = `<tr><td style="padding:16px 32px 24px;font-size:16px;line-height:1.6">
      <h1 style="font-size:22px;margin:8px 0 12px">${zh ? `确认关注「${esc(label)}」` : `Confirm you want to follow ${esc(label)}`}</h1>
      <p style="margin:0 0 20px">${zh ? "确认后，每当有关于它的新事件，我们会在每天早上 7 点（墨尔本时间）发一封汇总邮件给你。没有新事件就不发。" : "Once you confirm, we'll email you a short digest at 7am (Melbourne time) on days when there are new events about it. No new events, no email."}</p>
      <a href="${ok}" style="display:inline-block;background:#EA5514;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;font-size:14px">${zh ? "确认关注" : "Confirm"}</a>
      <p style="margin:20px 0 0;font-size:13px;color:#6B7280">${zh ? "如果不是你本人操作，忽略这封邮件即可。" : "If this wasn't you, just ignore this email."}</p></td></tr>`;
    return { to: f.email, subject: zh ? `确认关注：${label}` : `Confirm: follow ${label} on coda.news`, html: shell(body, unsub, zh), unsub };
  }));
  if (n) await sql`update follows set confirm_sent_at = now() where id in ${sql(list.slice(0, n).map((f) => f.id))}`;
  log(`follows: ${n} confirmations`);
  return n;
}

export async function sendFollowAlerts(): Promise<number> {
  const sql = db();
  const list = await rows("alert");
  const byEmail = new Map<string, { f: F; events: { slug: string; title: string; title_zh: string | null; summary: string; summary_zh: string | null; countries: string[] }[] }[]>();
  for (const f of list) {
    const since = f.last_sent_at ?? new Date(Date.now() - 86400_000).toISOString();
    const events = await sql<{ slug: string; title: string; title_zh: string | null; summary: string; summary_zh: string | null; countries: string[] }[]>`
      select slug, title, title_zh, summary, summary_zh, countries from events
      where summary is not null and status <> 'archived' and started_at > ${since}
        and ${f.company_id ? sql`${f.company_id} = any(company_ids)` : sql`${f.topic_id} = any(topic_ids)`}
      order by importance desc limit 5`;
    if (events.length) byEmail.set(f.email, [...(byEmail.get(f.email) ?? []), { f, events }]);
  }
  const mails = [...byEmail.values()].map((groups) => {
    const zh = groups[0].f.lang === "zh";
    const unsub = `${SITE}${zh ? "/zh" : ""}/follow?t=${groups[0].f.token}&a=stop`;
    const body = groups.map(({ f, events }) => {
      const label = zh && f.name_zh ? f.name_zh : f.name;
      return `<tr><td style="padding:16px 32px 4px"><div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#C2410C;text-transform:uppercase">${esc(label)}</div></td></tr>` +
        events.map((e) => `<tr><td style="padding:8px 32px 12px;border-bottom:1px solid #F0F1F3">
          <a href="${SITE}${zh ? "/zh" : ""}/event/${e.slug}" style="font-size:17px;font-weight:700;color:#16181D;text-decoration:none;line-height:1.35">${esc((zh && e.title_zh) || e.title)}</a>
          <p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:#4B5563">${esc(((zh && e.summary_zh) || e.summary).slice(0, 220))}</p>
          <div style="margin-top:6px;font-size:12px;color:#6B7280">${e.countries.length} ${zh ? "个国家报道" : e.countries.length === 1 ? "country" : "countries"}</div></td></tr>`).join("") +
        `<tr><td style="padding:8px 32px 8px;font-size:12px"><a href="${pageOf(f)}" style="color:#6B7280">${zh ? "查看全部" : "See all"} →</a> · <a href="${SITE}${zh ? "/zh" : ""}/follow?t=${f.token}&a=stop" style="color:#6B7280">${zh ? "取消关注" : "Unfollow"}</a></td></tr>`;
    }).join("");
    const names = groups.map(({ f }) => (zh && f.name_zh ? f.name_zh : f.name)).slice(0, 3).join(zh ? "、" : ", ");
    return { to: groups[0].f.email, subject: zh ? `${names} 有新动态` : `New on coda.news: ${names}`, html: shell(body, unsub, zh), unsub, ids: groups.map(({ f }) => f.id) };
  });
  const n = await send(mails);
  const sentIds = mails.slice(0, n).flatMap((m) => m.ids);
  if (sentIds.length) await sql`update follows set last_sent_at = now() where id in ${sql(sentIds)}`;
  log(`follows: ${n} alert emails`);
  return n;
}
