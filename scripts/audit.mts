import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { auditEvents } = await import("../supabase/functions/_shared/audit.ts");
const { regenerate } = await import("../supabase/functions/_shared/regenerate.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
let n = 0; for (let i = 0; i < (+process.argv[2] || 3); i++) n += await auditEvents(6);
console.log("fixed", n); await regenerate(3); await closeDb();
