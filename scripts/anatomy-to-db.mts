// Copy one code profile into anatomy_profiles: npx tsx scripts/anatomy-to-db.mts <slug> <publish_at ISO | draft>
import { config } from "dotenv"; config({ path: ".env.local" });
import postgres from "postgres";
import { PROFILES } from "../src/lib/anatomy";
const [slug, at] = process.argv.slice(2);
const p = PROFILES.find((x) => x.slug === slug);
if (!p) throw new Error(`no profile ${slug}`);
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, onnotice: () => {} });
const publish = at && at !== "draft" ? new Date(at).toISOString() : null;
await sql`insert into anatomy_profiles (slug, no, data, publish_at) values (${p.slug}, ${p.no}, ${sql.json(JSON.parse(JSON.stringify(p)))}, ${publish})
  on conflict (slug) do update set no = excluded.no, data = excluded.data, publish_at = excluded.publish_at`;
const [r] = await sql`select slug, no, publish_at, length(data::text) n from anatomy_profiles where slug = ${slug}`;
console.log(r);
await sql.end();
