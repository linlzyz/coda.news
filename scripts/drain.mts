import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { processBatch } = await import("../supabase/functions/_shared/process.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
const t0 = Date.now(); let n = 0;
while (Date.now() - t0 < (+process.argv[2] || 140) * 1000) { try { const r = await processBatch(); n += r.relevant; if (!r.claimed) break; } catch (e) { console.log((e as Error).message.slice(0, 100)); } }
console.log("relevant", n); await closeDb();
