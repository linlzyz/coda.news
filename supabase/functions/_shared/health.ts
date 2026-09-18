// Daily health report for the site owner (07:00 Melbourne). Recipient: REPORT_EMAIL secret.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

export async function sendHealthReport(force = false): Promise<boolean> {
  const to = env("REPORT_EMAIL"), key = env("RESEND_API_KEY");
  if (!to || !key) return false;
  const sql = db();
  const hour = +new Date().toLocaleString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  if (!force && hour !== 7) return false;
  if (!force && (await sql`select 1 from health_reports where sent_on = ${today}`).length) return false;

  const [a] = await sql`select count(*)::int total, count(*) filter (where status='done')::int done, count(*) filter (where status='skipped')::int skipped,
      count(*) filter (where status='failed')::int failed, count(*) filter (where status='pending')::int pending
    from articles where fetched_at > now() - interval '24 hours'`;
  const [backlog] = await sql`select count(*)::int n from articles where status = 'pending'`;
  const cats = await sql`select category, count(*)::int n from events where started_at > now() - interval '24 hours' and summary is not null group by 1 order by 2 desc`;
  const [ev] = await sql`select count(*)::int n, count(*) filter (where array_length(countries,1) >= 2)::int multi,
      count(*) filter (where image_url is null)::int noimg from events where started_at > now() - interval '24 hours' and summary is not null`;
  const broken = await sql`select name, country, last_status, fail_count, last_fetched_at from sources
    where active and (fail_count >= 3 or last_status like 'error%') order by fail_count desc limit 20`;
  const quiet = await sql`select s.name, s.country from sources s where s.active and not exists
    (select 1 from articles a where a.source_id = s.id and a.fetched_at > now() - interval '48 hours') order by s.name limit 20`;
  const runs = await sql`select count(*)::int n, count(*) filter (where status_code <> 200 or content like '%"error"%' or content like '%stopped%')::int bad
    from net._http_response where created > now() - interval '24 hours'`;
  const quota = await sql`select count(*)::int n from net._http_response where created > now() - interval '24 hours' and content like '%out of daily quota%'`;
  const fb = await sql`select f.kind, f.note, f.lang, e.slug, e.title from feedback f left join events e on e.id = f.event_id
    where f.created_at > now() - interval '24 hours' order by f.created_at desc limit 30`;
  const [subs] = await sql`select count(*) filter (where unsubscribed_at is null)::int active, count(*) filter (where created_at > now() - interval '24 hours')::int new,
      count(*) filter (where unsubscribed_at > now() - interval '24 hours')::int gone from subscribers`;
  const [brief] = await sql`select recipients from newsletter_issues where sent_on = ${today}`;

  const ok = broken.length === 0 && runs[0].bad <= 3 && a.failed < 20 && backlog.n < 500;
  const row = (k: string, v: unknown) => `<tr><td style="padding:4px 12px 4px 0;color:#6B7280">${k}</td><td style="padding:4px 0;font-weight:600">${esc(v)}</td></tr>`;
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#16181D;max-width:640px">
  <h2 style="margin:0 0 4px">coda.news 每日健康报告 · ${today}</h2>
  <p style="margin:0 0 16px;color:${ok ? "#15803D" : "#B91C1C"};font-weight:700">${ok ? "一切正常" : "有需要留意的地方（见下方标红部分）"}</p>
  <h3>过去 24 小时</h3><table>
  ${row("抓到新闻", a.total)}${row("归入事件", a.done)}${row("过滤掉（不相关）", a.skipped)}${row("处理失败", a.failed)}${row("排队中（全部）", backlog.n)}
  ${row("新事件", ev.n)}${row("多国报道的新事件", ev.multi)}${row("暂时没有配图", ev.noimg)}
  ${row("按栏目", cats.map((c) => `${c.category} ${c.n}`).join(" · ") || "无")}
  ${row("自动流程运行次数", `${runs[0].n}（出错 ${runs[0].bad}）`)}${row("AI 免费额度用尽的次数", quota[0].n)}
  ${row("订阅者", `${subs.active}（新增 ${subs.new}，退订 ${subs.gone}）`)}${row("今天的简报发送", brief ? `${brief.recipients} 封` : "未发送（事件不足或尚未到时间）")}
  </table>
  <h3 style="color:${broken.length ? "#B91C1C" : "#16181D"}">出错的新闻源（${broken.length}）</h3>
  ${broken.length ? `<ul>${broken.map((b) => `<li>${esc(b.name)}（${b.country}）：${esc(b.last_status)}，连续失败 ${b.fail_count} 次</li>`).join("")}</ul>` : "<p>无</p>"}
  <h3>48 小时没有新内容的新闻源（${quiet.length}）</h3>
  ${quiet.length ? `<p style="color:#6B7280">${quiet.map((q) => `${esc(q.name)}（${q.country}）`).join("、")}</p><p style="color:#6B7280;font-size:13px">有些来源本来就更新少（如央行），偶尔出现在这里是正常的。</p>` : "<p>无</p>"}
  <h3 style="color:${fb.length ? "#B91C1C" : "#16181D"}">读者报告的错误（${fb.length}）</h3>
  ${fb.length ? `<ul>${fb.map((f) => `<li><b>${esc(f.kind)}</b> · <a href="https://coda.news/event/${esc(f.slug)}">${esc(f.title)}</a>${f.note ? `<br><span style="color:#374151">${esc(f.note)}</span>` : ""}</li>`).join("")}</ul>` : "<p>无</p>"}
  <p style="color:#9CA3AF;font-size:12px;margin-top:24px">自动发送 · coda.news</p></div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "coda.news Health <health@coda.news>", to: [to], subject: `${ok ? "✅" : "⚠️"} coda.news 健康报告 ${today}`, html }),
  });
  if (!r.ok) { log("health report", r.status, (await r.text()).slice(0, 200)); return false; }
  await sql`insert into health_reports (sent_on) values (${today}) on conflict do nothing`;
  log("health report sent");
  return true;
}
