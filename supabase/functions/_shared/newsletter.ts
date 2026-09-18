// The Daily Coda: welcome emails for new subscribers, and one brief a day (07:00 Melbourne).
import { db } from "./db.ts";
import { env, log } from "./env.ts";

const FROM = "The Daily Coda <brief@coda.news>";
const SITE = "https://coda.news";
export const esc = (s: string) => String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));

export async function send(emails: { to: string; subject: string; html: string; unsub: string }[]) {
  const key = env("RESEND_API_KEY"); if (!key || !emails.length) return 0;
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100).map((m) => ({
      from: FROM, to: [m.to], subject: m.subject, html: m.html, reply_to: "info@coda.news",
      headers: { "List-Unsubscribe": `<${m.unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }));
    const r = await fetch("https://api.resend.com/emails/batch", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(batch),
    });
    if (!r.ok) { log("resend", r.status, (await r.text()).slice(0, 200)); break; }
    sent += batch.length;
  }
  return sent;
}

export function shell(body: string, unsub: string, zh: boolean) {
  return `<!doctype html><html><body style="margin:0;background:#F4F5F7;font-family:Inter,Helvetica,Arial,sans-serif;color:#16181D">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:24px 12px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff">
<tr><td style="padding:28px 32px 8px"><a href="${SITE}" style="text-decoration:none;color:#16181D;font-size:26px;font-weight:700;letter-spacing:-0.5px">coda<span style="color:#EA5514">.</span>news</a>
<div style="font-size:13px;color:#6B7280;margin-top:4px">${zh ? "一件事，全世界怎么看。" : "One story. Every perspective."}</div></td></tr>
${body}
<tr><td style="padding:24px 32px 32px;border-top:1px solid #E5E7EB;font-size:12px;line-height:1.6;color:#6B7280">
${zh ? "摘要由 AI 根据所链接的来源生成，请以原文为准。" : "Summaries are AI-generated from the linked sources. Always check the originals."}<br>
<a href="${unsub}" style="color:#6B7280">${zh ? "退订" : "Unsubscribe"}</a> · <a href="${SITE}/legal/privacy" style="color:#6B7280">${zh ? "隐私政策" : "Privacy Policy"}</a> · coda.news, Melbourne, Australia
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendWelcomes(): Promise<number> {
  const sql = db();
  const subs = await sql<{ id: number; email: string; lang: string; token: string }[]>`
    select id, email, lang, token from subscribers where welcomed_at is null and unsubscribed_at is null order by id limit 50`;
  if (!subs.length) return 0;
  const n = await send(subs.map((s) => {
    const zh = s.lang === "zh"; const unsub = `${SITE}/unsubscribe?t=${s.token}`;
    const body = `<tr><td style="padding:16px 32px 24px;font-size:16px;line-height:1.6">
      <h1 style="font-size:22px;margin:8px 0 12px">${zh ? "欢迎订阅 Coda 每日简报" : "Welcome to The Daily Coda"}</h1>
      <p style="margin:0 0 12px">${zh ? "每天早上 7 点（墨尔本时间），我们会把最重要的科技与经济事件发给你，并告诉你各国媒体分别怎么报道。" : "Every morning at 7am (Melbourne time) you'll get the day's biggest technology and economy events, and how media in each country told them."}</p>
      <p style="margin:0 0 20px">${zh ? "在第一期到来之前，可以先看看今天的事件：" : "Until the first issue arrives, here is today's front page:"}</p>
      <a href="${SITE}" style="display:inline-block;background:#EA5514;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;font-size:14px">${zh ? "打开 coda.news" : "Open coda.news"} →</a></td></tr>`;
    return { to: s.email, subject: zh ? "欢迎订阅 Coda 每日简报" : "Welcome to The Daily Coda", html: shell(body, unsub, zh), unsub };
  }));
  if (n) await sql`update subscribers set welcomed_at = now() where id in ${sql(subs.slice(0, n).map((s) => s.id))}`;
  log(`newsletter: ${n} welcome emails`);
  return n;
}

export async function sendDailyBrief(force = false): Promise<number> {
  const sql = db();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  const hour = +new Date().toLocaleString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" });
  if (!force && hour !== 7) return 0;   // cron fires at 20:00 and 21:00 UTC; only the one that is 7am in Melbourne sends
  if (!force && (await sql`select 1 from newsletter_issues where sent_on = ${today}`).length) return 0;
  const events = await sql<{ id: number; slug: string; title: string; title_zh: string | null; summary: string; summary_zh: string | null; countries: string[]; source_count: number; image_url: string | null }[]>`
    select id, slug, title, title_zh, summary, summary_zh, countries, source_count, image_url from events
    where summary is not null and last_article_at > now() - interval '24 hours' and array_length(countries, 1) >= 2
    order by importance desc limit 5`;
  if (events.length < 3) { log("newsletter: not enough events for a brief"); return 0; }
  const ids = events.map((e) => e.id);
  const persp = await sql<{ event_id: number; country: string; framing: string | null; framing_zh: string | null }[]>`
    select event_id, country, framing, framing_zh from perspectives where event_id in ${sql(ids)} order by article_count desc`;
  const subs = await sql<{ id: number; email: string; lang: string; token: string }[]>`
    select id, email, lang, token from subscribers where unsubscribed_at is null and welcomed_at is not null`;
  const dateLabel = (zh: boolean) => new Date().toLocaleDateString(zh ? "zh-CN" : "en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });
  const render = (zh: boolean) => events.map((e, i) => {
    const ps = persp.filter((p) => p.event_id === e.id).slice(0, 4)
      .map((p) => `<b>${p.country}</b> ${esc((zh && p.framing_zh) || p.framing || "")}`).join(" &nbsp;·&nbsp; ");
    return `<tr><td style="padding:20px 32px;border-top:${i ? "1px solid #E5E7EB" : "2px solid #16181D"}">
      ${i === 0 && e.image_url ? `<img src="${e.image_url}" width="536" style="width:100%;max-width:536px;display:block;margin-bottom:14px" alt="">` : ""}
      <div style="font-size:12px;color:#C2410C;font-weight:700">${String(i + 1).padStart(2, "0")} · ${e.countries.length} ${zh ? "个国家" : "countries"} · ${e.source_count} ${zh ? "个来源" : "sources"}</div>
      <a href="${SITE}/event/${e.slug}" style="display:block;margin:6px 0 8px;font-size:${i ? 18 : 22}px;font-weight:700;line-height:1.3;color:#16181D;text-decoration:none">${esc((zh && e.title_zh) || e.title)}</a>
      <div style="font-size:15px;line-height:1.6;color:#374151">${esc((zh && e.summary_zh) || e.summary)}</div>
      ${ps ? `<div style="font-size:13px;line-height:1.6;color:#4B5563;margin-top:10px">${ps}</div>` : ""}
      <a href="${SITE}/event/${e.slug}" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:#C2410C;text-decoration:none">${zh ? "对比各国报道" : "Compare the coverage"} →</a>
    </td></tr>`;
  }).join("");
  const n = await send(subs.map((s) => {
    const zh = s.lang === "zh"; const unsub = `${SITE}/unsubscribe?t=${s.token}`;
    const head = `<tr><td style="padding:8px 32px 4px;font-size:13px;color:#6B7280">${dateLabel(zh)}</td></tr>`;
    return { to: s.email, subject: `${zh ? "Coda 每日简报" : "The Daily Coda"}: ${(zh && events[0].title_zh) || events[0].title}`, html: shell(head + render(zh), unsub, zh), unsub };
  }));
  await sql`insert into newsletter_issues (sent_on, event_ids, recipients) values (${today}, ${ids}, ${n}) on conflict (sent_on) do update set recipients = excluded.recipients`;
  if (n) await sql`update subscribers set last_sent_at = now() where unsubscribed_at is null and welcomed_at is not null`;
  log(`newsletter: daily brief to ${n}`);
  return n;
}
