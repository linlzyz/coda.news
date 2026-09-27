// Editor controls for the site owner, used by coda.news/admin. Every request needs the ADMIN_KEY.
//   POST { key, action: "list", q?, filter? }                        -> recent stories
//   POST { key, action: "hide"|"unhide"|"pin"|"unpin"|"noimage"|"retranslate"|"category", id, value? }
import { db } from "../_shared/db.ts";
import { env } from "../_shared/env.ts";
import { publishInstagram } from "../_shared/instagram.ts";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
const CATS = ["technology", "economy", "sport", "entertainment", "fashion", "travel", "automotive", "gaming"];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "content-type": "application/json" } });

async function refresh(slugs: string[], lists: boolean) {
  const secret = env("REVALIDATE_SECRET"); if (!secret) return;
  await fetch("https://coda.news/api/revalidate", { method: "POST", headers: { "content-type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ events: slugs, sections: lists, home: lists }), signal: AbortSignal.timeout(8000) }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  // links from the nightly Instagram email: /admin?ig=approve|skip&t=<one-time token>
  const u = new URL(req.url);
  if (req.method === "GET" && u.searchParams.get("ig")) {
    const page = (msg: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:Helvetica,Arial,sans-serif;padding:40px;max-width:560px;margin:auto"><h2>coda.news · Instagram</h2><p>${msg}</p></body>`, { headers: { "content-type": "text/html; charset=utf-8" } });
    const t = u.searchParams.get("t") ?? "";
    if (!/^[0-9a-f-]{36}$/.test(t)) return page("链接无效。");
    const sql = db();
    const [p] = await sql<{ id: number; status: string; permalink: string | null }[]>`select id, status, permalink from ig_posts where approve_token = ${t}::uuid and created_at > now() - interval '3 days'`;
    if (!p) return page("链接已过期或无效。");
    if (p.status === "approved") return page("正在发布中，请稍等一两分钟。");
    if (p.status === "posted") return page(`已经发布过了。${p.permalink ? `<a href="${p.permalink}">查看帖子</a>` : ""}`);
    if (u.searchParams.get("ig") === "skip") { await sql`update ig_posts set status = 'skipped' where id = ${p.id} and status <> 'posted'`; return page("好的，今晚跳过。"); }
    await sql`update ig_posts set status = 'approved' where id = ${p.id}`;
    // publishing takes a minute or two: run it in the background and answer at once
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(publishInstagram(p.id).catch(() => {}));
    return page("正在发布到 @thecodanews，一两分钟后就能在 Instagram 看到。再点一次这个链接可以查看状态。");
  }
  const b = await req.json().catch(() => ({}));
  const key = env("ADMIN_KEY");
  if (!key || b.key !== key) return json({ error: "wrong key" }, 403);
  const sql = db();
  const id = Number(b.id);

  // system status report for the admin page: every check says what it measured, when that last happened, and ok/warn/bad
  if (b.action === "status") {
    type Check = { group: string; label: string; state: "ok" | "warn" | "bad"; value: string; at: string | null };
    const out: Check[] = [];
    const ago = (t: string | Date | null) => t ? (Date.now() - new Date(t).getTime()) / 60000 : Infinity;   // minutes
    const add = (group: string, label: string, state: Check["state"], value: string, at: string | Date | null = null) =>
      out.push({ group, label, state, value, at: at ? new Date(at).toISOString() : null });
    const run = async (group: string, label: string, f: () => Promise<void>) => {
      try { await f(); } catch (e) { add(group, label, "bad", `查询失败：${(e as Error).message.slice(0, 80)}`); }
    };
    const t0 = Date.now();
    await run("数据库", "响应速度", async () => {
      await sql`select 1`; const ms = Date.now() - t0;
      add("数据库", "响应速度", ms < 800 ? "ok" : ms < 3000 ? "warn" : "bad", `${ms} ms`, new Date());
    });
    await run("数据库", "大小", async () => {
      const [r] = await sql`select pg_database_size(current_database())::bigint b`;
      const mb = Math.round(Number(r.b) / 1048576);
      add("数据库", "大小", mb < 6000 ? "ok" : "warn", `${mb} MB`);
    });
    await run("流水线", "定时任务", async () => {
      const [r] = await sql`select max(start_time) filter (where status = 'succeeded') last_ok, count(*) filter (where status <> 'succeeded' and status <> 'running')::int bad, count(*)::int n
        from cron.job_run_details where start_time > now() - interval '1 hour'`;
      const m = ago(r.last_ok);
      add("流水线", "定时任务", m < 12 && r.bad <= 2 ? "ok" : m < 30 ? "warn" : "bad", `最近 1 小时 ${r.n} 次，失败 ${r.bad} 次`, r.last_ok);
    });
    await run("流水线", "抓取新闻", async () => {
      const [r] = await sql`select max(fetched_at) t, count(*) filter (where fetched_at > now() - interval '1 hour')::int n from articles where fetched_at > now() - interval '6 hours'`;
      const m = ago(r.t);
      add("流水线", "抓取新闻", m < 20 ? "ok" : m < 60 ? "warn" : "bad", `最近 1 小时 ${r.n} 篇`, r.t);
    });
    await run("流水线", "AI 处理", async () => {
      const [r] = await sql`select count(*) filter (where status = 'pending')::int pending, count(*) filter (where status = 'failed' and created_at > now() - interval '24 hours')::int failed,
          count(*) filter (where status = 'processing' and fetched_at < now() - interval '20 minutes')::int stuck from articles where status in ('pending','failed','processing')`;
      add("流水线", "AI 处理", r.pending < 300 && r.failed < 30 && r.stuck === 0 ? "ok" : r.pending < 800 ? "warn" : "bad",
        `排队 ${r.pending} 篇 · 24 小时失败 ${r.failed} 篇${r.stuck ? ` · 卡住 ${r.stuck} 篇` : ""}`);
    });
    await run("流水线", "新事件", async () => {
      const [r] = await sql`select max(started_at) t, count(*) filter (where started_at > now() - interval '24 hours')::int n from events where started_at > now() - interval '2 days' and summary is not null`;
      const m = ago(r.t);
      add("流水线", "新事件", m < 60 ? "ok" : m < 180 ? "warn" : "bad", `24 小时新增 ${r.n} 条`, r.t);
    });
    await run("网站内容", "首页最新新闻", async () => {
      const [r] = await sql`select max(last_article_at) t from events where not hidden and summary is not null and last_article_at > now() - interval '2 days'`;
      const m = ago(r.t);
      add("网站内容", "首页最新新闻", m < 45 ? "ok" : m < 120 ? "warn" : "bad", Number.isFinite(m) ? `${Math.round(m)} 分钟前` : "无", r.t);
    });
    await run("网站内容", "行情数据", async () => {
      const [r] = await sql`select max(updated_at) t, count(*)::int n, max(as_of)::text as_of from market_series`;
      const m = ago(r.t);
      add("网站内容", "行情数据", m < 6 * 60 ? "ok" : m < 24 * 60 ? "warn" : "bad", `${r.n} 项 · 收盘日 ${r.as_of ?? "无"}`, r.t);
    });
    await run("网站内容", "新品发布（近 3 天有图）", async () => {
      const [r] = await sql`select count(*)::int n, max(last_article_at) t from events where not hidden and image_url is not null and summary is not null
        and category in ('automotive','technology','gaming','fashion') and last_article_at > now() - interval '72 hours'`;
      add("网站内容", "新品发布（近 3 天有图）", r.n >= 20 ? "ok" : r.n >= 5 ? "warn" : "bad", `候选 ${r.n} 条`, r.t);
    });
    await run("网站内容", "置顶精选", async () => {
      const [r] = await sql`select count(*)::int n, min(pinned_at) t from events where pinned_at > now() - interval '72 hours' and not hidden`;
      add("网站内容", "置顶精选", "ok", r.n ? `${r.n} 条（72 小时后自动取消）` : "无", r.t);
    });
    await run("网站内容", "今日简报", async () => {
      const [r] = await sql`select sent_on::text d, recipients, created_at from newsletter_issues order by sent_on desc limit 1`;
      add("网站内容", "今日简报", r && ago(r.created_at) < 30 * 60 ? "ok" : "warn", r ? `${r.d} 发出 ${r.recipients} 封` : "未发送", r?.created_at ?? null);
    });
    await run("新闻源", "新闻源", async () => {
      const [r] = await sql`select count(*) filter (where active)::int active, count(*) filter (where active and fail_count >= 6)::int broken,
          count(*) filter (where not active)::int off from sources`;
      const bad = await sql`select name from sources where active and fail_count >= 6 order by fail_count desc limit 5`;
      add("新闻源", "新闻源", r.broken === 0 ? "ok" : r.broken <= 3 ? "warn" : "bad",
        `启用 ${r.active} 个 · 出错 ${r.broken} 个${bad.length ? `（${bad.map((x) => x.name).join("、")}）` : ""} · 已停用 ${r.off} 个`);
    });
    await run("成本", "AI 花费（今天）", async () => {
      const [r] = await sql`select coalesce(sum(usd), 0)::float usd, coalesce(sum(calls), 0)::int calls from ai_usage where day = (now() at time zone 'utc')::date`;
      const cap = Number(env("OPENAI_DAILY_USD") || "0.30");
      add("成本", "AI 花费（今天）", r.usd < cap * 0.8 ? "ok" : r.usd < cap ? "warn" : "bad", `US$${r.usd.toFixed(3)} / 上限 US$${cap.toFixed(2)} · ${r.calls} 次`);
    });
    await run("读者", "订阅者", async () => {
      const [r] = await sql`select count(*) filter (where unsubscribed_at is null)::int n, count(*) filter (where created_at > now() - interval '7 days')::int wk from subscribers`;
      add("读者", "订阅者", "ok", `${r.n} 人 · 7 天新增 ${r.wk}`);
    });
    await run("读者", "读者报错", async () => {
      const [r] = await sql`select count(*)::int n, max(created_at) t from feedback where created_at > now() - interval '24 hours'`;
      add("读者", "读者报错", r.n === 0 ? "ok" : "warn", `24 小时 ${r.n} 条`, r.t);
    });
    return json({ checks: out, at: new Date().toISOString(), ms: Date.now() - t0 });
  }

  if (b.action === "list") {
    const q = String(b.q ?? "").trim();
    const f = String(b.filter ?? "recent");
    const rows = await sql`
      select id, slug, title, title_zh, summary_zh, category, review_note, reviewed_at, image_url, image_source, image_focus, source_count, countries, hidden, pinned_at, last_article_at, lead_url, lead_source
      from events where summary is not null
        and ${f === "flagged" ? sql`not hidden and review_note like '待确认%'` : f === "auto" ? sql`review_note like '自动%' and reviewed_at > now() - interval '2 days'` : f === "hidden" ? sql`hidden` : f === "pinned" ? sql`pinned_at is not null and not hidden` : f === "noimage" ? sql`not hidden and image_url is null and source_count >= 2` : sql`not hidden`}
        and ${q ? sql`(title ilike ${"%" + q + "%"} or title_zh ilike ${"%" + q + "%"})` : sql`true`}
      order by ${f === "pinned" ? sql`pinned_at desc` : f === "auto" ? sql`reviewed_at desc` : sql`last_article_at desc`} limit 80`;
    return json({ rows });
  }

  if (!id) return json({ error: "no id" }, 400);
  const [e] = await sql<{ slug: string; image_url: string | null }[]>`select slug, image_url from events where id = ${id}`;
  if (!e) return json({ error: "not found" }, 404);

  switch (b.action) {
    case "hide": await sql`update events set hidden = true, pinned_at = null, review_note = '手动下架', updated_at = now() where id = ${id}`; break;
    case "unhide": await sql`update events set hidden = false, review_note = '已确认没问题', updated_at = now() where id = ${id}`; break;
    case "ok": await sql`update events set review_note = '已确认没问题' where id = ${id}`; break;
    case "pin": await sql`update events set pinned_at = now(), updated_at = now() where id = ${id}`; break;
    case "unpin": await sql`update events set pinned_at = null, updated_at = now() where id = ${id}`; break;
    case "noimage":
      // this picture is wrong: never use it again for this story, and look for another
      await sql`update events set image_blocked = array(select distinct unnest(image_blocked || ${e.image_url ? [e.image_url] : []}::text[])),
        image_url = null, image_credit = null, image_link = null, image_source = null, image_license = null, image_focus = null,
        image_checked_at = null, brand_checked_at = null, press_checked_at = null, updated_at = now() where id = ${id}`; break;
    case "retranslate": await sql`update events set title_zh = null, summary_zh = null, zh_checked_at = null, needs_regen = true, updated_at = now() where id = ${id}`; break;
    case "category":
      if (!CATS.includes(b.value)) return json({ error: "bad category" }, 400);
      await sql`update events set category = ${b.value}, updated_at = now() where id = ${id}`; break;
    default: return json({ error: "unknown action" }, 400);
  }
  await refresh([e.slug], ["hide", "unhide", "pin", "unpin", "category", "ok"].includes(b.action));
  return json({ ok: true });
});
