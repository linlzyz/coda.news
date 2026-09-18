import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { dedupe } = await import("../supabase/functions/_shared/dedupe.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
let total = 0; for (let i = 0; i < (+process.argv[2] || 5); i++) { const n = await dedupe(10); total += n; }
console.log("merged", total); await closeDb();
