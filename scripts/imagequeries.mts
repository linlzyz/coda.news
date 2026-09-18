// One-off: give important events a location-aware photo query, then re-pick their photos.
import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { db, closeDb } = await import("../supabase/functions/_shared/db.ts");
const { generateJSON } = await import("../supabase/functions/_shared/ai.ts");
const { assignImages } = await import("../supabase/functions/_shared/images.ts");
const sql = db();
const rows = await sql`select id, title from events where summary is not null and image_credit like '%Pexels%' order by importance desc limit 60`;
for (let i = 0; i < rows.length; i += 30) {
  const chunk = rows.slice(i, i + 30);
  const r = await generateJSON<{ items: { id: number; q: string }[] }>(`For each news headline give 2 to 4 English words for a stock photo scene. Use the place where it happens when relevant (e.g. "washington dc capitol", "seoul gas station"); otherwise a generic scene ("semiconductor wafer"). No company, brand, product or person names. Never a place in another country.
Return JSON only: {"items":[{"id":1,"q":"..."}]}
${chunk.map((c) => `id=${c.id}: ${c.title}`).join("\n")}`, "fast");
  for (const it of r.items ?? []) await sql`update events set image_query = ${it.q}, image_url = null, image_credit = null, image_link = null, image_checked_at = null where id = ${it.id}`;
}
let n = 0; for (let k = 0; k < 3; k++) n += await assignImages(25);
console.log("requeried", rows.length, "images", n);
console.log(await sql`select title, image_query from events where title ilike '%federal reserve%' or title ilike '%fuel tax%' limit 4`);
await closeDb();
