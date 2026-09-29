// Audit story pictures with the same vision check the pipeline now uses (supabase/functions/_shared/images.ts).
//   npx tsx scripts/imagecheck.mts [days=14] [limit=2000] [offset=0] [--apply]    without --apply it only lists what would be dropped
// Dropped pictures go into image_blocked (like the admin "wrong picture" button), so the story falls back to its designed cover.
import { config } from "dotenv"; config({ path: ".env.local" });
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const [days = "14", limit = "2000", offset = "0"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
const ids = process.argv.find((a) => a.startsWith("--ids="))?.slice(6).split(",").map(Number);

async function vision<T>(prompt: string, url: string): Promise<T | null> {
  const ua = /wikimedia\.org|wikipedia\.org/.test(url) ? "coda.news/1.0 (https://coda.news; info@coda.news)" : "Mozilla/5.0 (compatible; coda.news/1.0)";
  const img = await fetch(url, { headers: { "user-agent": ua }, signal: AbortSignal.timeout(12000) }).catch(() => null);
  const type = img?.headers.get("content-type") ?? "";
  if (!img?.ok || !/^image\/(jpeg|png|webp|gif)/.test(type)) return null;
  const b64 = Buffer.from(await img.arrayBuffer()).toString("base64");
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(90000),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "gpt-5-mini", reasoning_effort: "low", response_format: { type: "json_object" }, max_completion_tokens: 2000,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${type.split(";")[0]};base64,${b64}`, detail: "high" } }] }] }) }).catch(() => null);
  if (!r?.ok) return null;
  try { return JSON.parse((await r.json()).choices[0].message.content) as T; } catch { return null; }
}
// same prompts and thresholds as portraitFits / pressFits in supabase/functions/_shared/images.ts
type PortraitScore = { sharp?: number; flattering?: number; drawing?: boolean };
const portraitBad = (v: PortraitScore) => v.drawing === true || Number(v.sharp ?? 5) <= 2 || Number(v.flattering ?? 5) <= 1;
type PressScore = { other_brand?: boolean; fits?: number };
const pressBad = (v: PressScore) => Number(v.fits ?? 5) <= 1 || (v.other_brand === true && Number(v.fits ?? 5) <= 2);
async function portraitOk(name: string, url: string) {
  void name;
  const r = await vision<PortraitScore & { rating?: PortraitScore }>(`Rate this photo for use as a news portrait. Do not identify the person; rate the image only. JSON {"sharp":1-5 (5 = crisp, well-lit professional photo; 1 = blurry, dark, grainy phone or video still),"flattering":1-5 (1 = eyes half shut, drunk-looking, grimace),"drawing":true|false (drawing, engraving, cartoon or painting)}`, url);
  return r ? { ok: !portraitBad(r.rating ?? r), v: r } : null;
}
async function pressOk(title: string, brand: string | null, url: string) {
  const v = await vision<PressScore>(`This picture illustrates the news story "${title}"${brand ? ` (about ${brand})` : ""}. JSON {"other_brand":true|false (shows a different brand's product than the story's),"fits":1-5 (5 = shows the story's subject or a scene from it; 1 = unrelated to the story)}`, url);
  return v ? { ok: !pressBad(v), v } : null;
}

const rows = await sql<{ id: number; slug: string; title: string; image_url: string; image_source: string; image_focus: string | null; image_person: string | null; image_brand: string | null }[]>`
  select id, slug, title, image_url, image_source, image_focus, image_person, image_brand from events
  where not hidden and image_url is not null and (image_source = 'press' or (image_source = 'commons' and image_focus = 'top'))
    and ${ids ? sql`id = any(${ids})` : sql`last_article_at > now() - make_interval(days => ${Number(days)})`}
  order by id desc limit ${Number(limit)} offset ${Number(offset)}`;
let bad = 0, unknown = 0;
const queue = [...rows];
await Promise.all(Array.from({ length: 16 }, async () => {
  for (let e = queue.shift(); e; e = queue.shift()) {
    const res = e.image_focus === "top" && e.image_person ? await portraitOk(e.image_person, e.image_url) : await pressOk(e.title, e.image_brand, e.image_url);
    const ok = res ? res.ok : null;
    if (process.argv.includes("--why")) console.log("why", e.id, JSON.stringify(res?.v ?? null));
    if (ok === null) { unknown++; continue; }
    if (ok) continue;
    bad++;
    console.log(`${e.id}\t${e.image_source}\t${e.title.slice(0, 80)}\t${e.image_url.slice(0, 110)}`);
    if (apply) await sql`update events set image_blocked = array(select distinct unnest(image_blocked || ${[e.image_url]}::text[])),
        image_url = null, image_credit = null, image_link = null, image_source = null, image_license = null, image_focus = null,
        image_checked_at = null, brand_checked_at = null, press_checked_at = null, updated_at = now() where id = ${e.id}`;
  }
}));
console.log(`checked ${rows.length}, ${apply ? "dropped" : "would drop"} ${bad}, could not check ${unknown}`);
await sql.end();
