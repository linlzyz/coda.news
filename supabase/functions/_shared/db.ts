import postgres from "postgres";
import { env } from "./env.ts";

let _sql: ReturnType<typeof postgres> | null = null;
export function db() {
  if (!_sql) {
    const url = env("DATABASE_URL") || env("SUPABASE_DB_URL");
    if (!url) throw new Error("DATABASE_URL missing");
    _sql = postgres(url, { prepare: false, max: 4, idle_timeout: 20, onnotice: () => {} });
  }
  return _sql;
}
export async function closeDb() { if (_sql) { await _sql.end({ timeout: 5 }); _sql = null; } }
export const vec = (v: number[]) => `[${v.join(",")}]`;
