// Local run of the pipeline: npx tsx scripts/tick.mts [budgetSeconds]
import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { tick } = await import("../supabase/functions/_shared/tick.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
const r = await tick((+process.argv[2] || 120) * 1000);
console.log(JSON.stringify(r, null, 1));
await closeDb();
