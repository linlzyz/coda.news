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
    if (p.status === "posted") return page(`已经发布过了。${p.permalink ? `<a href="${p.permalink}">查看帖子</a>` : ""}`);
    if (u.searchParams.get("ig") === "skip") { await sql`update ig_posts set status = 'skipped' where id = ${p.id} and status <> 'posted'`; return page("好的，今晚跳过。"); }
    await sql`update ig_posts set status = 'approved' where id = ${p.id}`;
    try { const link = await publishInstagram(p.id); return page(`已发布到 @thecodanews。${link.startsWith("http") ? `<a href="${link}">查看帖子</a>` : ""}`); }
    catch (e) { return page(`发布失败：${String((e as Error).message).replace(/[<>&]/g, "")}<br>可以稍后再点一次这个链接重试。`); }
  }
  const b = await req.json().catch(() => ({}));
  const key = env("ADMIN_KEY");
  if (!key || b.key !== key) return json({ error: "wrong key" }, 403);
  const sql = db();
  const id = Number(b.id);

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
