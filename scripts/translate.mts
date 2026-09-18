import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { translateMissing } = await import("../supabase/functions/_shared/translate.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
let t = 0; for (let i = 0; i < (+process.argv[2] || 5); i++) { const n = await translateMissing(30); t += n; if (!n) break; }
console.log("translated", t); await closeDb();
