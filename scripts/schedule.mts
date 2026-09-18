import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
import postgres from "postgres"; import { readFileSync } from "fs";
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const q = readFileSync("supabase/migrations/0004_schedule.sql.template", "utf8").replaceAll("__REF__", ref).replaceAll("__SECRET__", process.env.CRON_SECRET!);
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, onnotice: () => {} });
await sql.unsafe(q);
console.log(await sql`select jobname, schedule, active from cron.job order by jobname`);
await sql.end();
