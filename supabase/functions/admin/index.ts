// Editor controls for the site owner, used by coda.news/admin. Every request needs the ADMIN_KEY.
//   POST { key, action: "list", q?, filter? }                        -> recent stories
//   POST { key, action: "hide"|"unhide"|"pin"|"unpin"|"noimage"|"retranslate"|"category", id, value? }
import { db } from "../_shared/db.ts";
import { env } from "../_shared/env.ts";

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
  const b = await req.json().catch(() => ({}));
  const key = env("ADMIN_KEY");
  if (!key || b.key !== key) return json({ error: "wrong key" }, 403);
  const sql = db();
  const id = Number(b.id);

  if (b.action === "list") {
    const q = String(b.q ?? "").trim();
    const f = String(b.filter ?? "recent");
    const rows = await sql`
      select id, slug, title, title_zh, summary_zh, category, image_url, image_source, image_focus, source_count, countries, hidden, pinned_at, last_article_at, lead_url, lead_source
      from events where summary is not null
        and ${f === "hidden" ? sql`hidden` : f === "pinned" ? sql`pinned_at is not null and not hidden` : f === "noimage" ? sql`not hidden and image_url is null and source_count >= 2` : sql`not hidden`}
        and ${q ? sql`(title ilike ${"%" + q + "%"} or title_zh ilike ${"%" + q + "%"})` : sql`true`}
      order by ${f === "pinned" ? sql`pinned_at desc` : sql`last_article_at desc`} limit 80`;
    return json({ rows });
  }

  if (!id) return json({ error: "no id" }, 400);
  const [e] = await sql<{ slug: string; image_url: string | null }[]>`select slug, image_url from events where id = ${id}`;
  if (!e) return json({ error: "not found" }, 404);

  switch (b.action) {
    case "hide": await sql`update events set hidden = true, pinned_at = null, updated_at = now() where id = ${id}`; break;
    case "unhide": await sql`update events set hidden = false, updated_at = now() where id = ${id}`; break;
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
  await refresh([e.slug], ["hide", "unhide", "pin", "unpin", "category"].includes(b.action));
  return json({ ok: true });
});
