import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { translateFacts, translateMissing } = await import("../supabase/functions/_shared/translate.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
let n = 0; for (let i = 0; i < (+process.argv[2] || 4); i++) { n += await translateFacts(80); await translateMissing(30); }
console.log("facts", n); await closeDb();
