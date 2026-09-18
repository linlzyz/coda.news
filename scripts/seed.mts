import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
import postgres from "postgres";
import { readFileSync } from "fs";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, onnotice: () => {} });
await sql.unsafe(readFileSync("supabase/migrations/0002_seed.sql", "utf8"));
const rows = JSON.parse(readFileSync("data/sources.json", "utf8"));
for (const [name, country, language, type, rss_url, homepage] of rows) {
  await sql`insert into sources ${sql({ name, country, language, type, rss_url, homepage, reliability: type === "official" ? 95 : 75 })}
            on conflict (rss_url) do update set name = excluded.name, country = excluded.country, language = excluded.language, type = excluded.type, homepage = excluded.homepage`;
}
const [s] = await sql`select count(*)::int n, count(distinct country)::int c from sources`;
const [t] = await sql`select count(*)::int n from topics`;
console.log(`sources: ${s.n} (${s.c} countries), topics: ${t.n}`);
await sql.end();
