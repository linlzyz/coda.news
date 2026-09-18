// Run a SQL file against the database: npx tsx scripts/sql.ts supabase/migrations/0001_init.sql
import { config } from "dotenv"; config({ path: ".env.local" });
import postgres from "postgres";
import { readFileSync } from "fs";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, onnotice: () => {} });
const file = process.argv[2];
const q = file ? readFileSync(file, "utf8") : process.argv.slice(3).join(" ");
try { const r = await sql.unsafe(q); console.log(file ? `ok: ${file}` : JSON.stringify(r, null, 1)); }
catch (e: any) { console.error("ERROR:", e.message); process.exitCode = 1; }
finally { await sql.end(); }
