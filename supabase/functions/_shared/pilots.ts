// New pilot requests from coda.news/business: tell business@ (and the owner), and confirm to the applicant.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

async function mail(to: string[], subject: string, html: string, replyTo?: string) {
  const key = env("RESEND_API_KEY"); if (!key) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "coda.news <business@coda.news>", to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) log("pilot mail", r.status, (await r.text()).slice(0, 160));
  return r.ok;
}

export async function notifyPilots(): Promise<number> {
  const sql = db();
  const rows = await sql<{ id: number; name: string | null; company: string; email: string; brands: string | null; note: string | null; lang: string }[]>`
    select id, name, company, email, brands, note, lang from pilot_requests where notified_at is null order by id limit 10`;
  for (const p of rows) {
    const owner = [...new Set(["business@coda.news", env("REPORT_EMAIL")].filter(Boolean) as string[])];
    await mail(owner, `试点申请：${p.company}`, `<div style="font-family:Helvetica,Arial,sans-serif">
      <h2 style="margin:0 0 12px">新的试点申请</h2>
      <p><b>公司 / 品牌：</b>${esc(p.company)}<br><b>姓名：</b>${esc(p.name)}<br><b>邮箱：</b>${esc(p.email)}<br>
      <b>竞争对手 / 行业：</b>${esc(p.brands)}<br><b>备注：</b>${esc(p.note)}<br><b>语言：</b>${p.lang}</p>
      <p>直接回复这封邮件即可联系对方。</p></div>`, p.email);
    const zh = p.lang === "zh";
    await mail([p.email], zh ? "已收到你的 coda.news 试点申请" : "Your coda.news pilot request", zh
      ? `<div style="font-family:Helvetica,Arial,sans-serif;line-height:1.6"><p>${esc(p.name || "你好")}，</p><p>谢谢你申请 coda.news 媒体报道监测试点（${esc(p.company)}）。我们会在两个工作日内回复，确认要关注的品牌、竞争对手和国家。</p><p>有任何问题，直接回复这封邮件即可。</p><p>coda.news · 一件事，每一种视角</p></div>`
      : `<div style="font-family:Helvetica,Arial,sans-serif;line-height:1.6"><p>Hi ${esc(p.name || "there")},</p><p>Thank you for applying for a coda.news coverage-monitoring pilot for ${esc(p.company)}. We will reply within two working days to confirm the brands, competitors and countries to follow.</p><p>Just reply to this email with any questions.</p><p>coda.news · One story. Every perspective.</p></div>`, "business@coda.news");
    await sql`update pilot_requests set notified_at = now() where id = ${p.id}`;
  }
  if (rows.length) log(`pilots: ${rows.length} new`);
  return rows.length;
}
