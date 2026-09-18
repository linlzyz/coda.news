// Run a single pipeline step locally: npx tsx scripts/step.mts ingest|process|regenerate|maintain
import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const step = process.argv[2];
const m = await import(`../supabase/functions/_shared/${step === "process" ? "process" : step}.ts`);
const fn = step === "process" ? m.processBatch : m[step];
console.log(JSON.stringify(await fn(), null, 1));
await (await import("../supabase/functions/_shared/db.ts")).closeDb();
