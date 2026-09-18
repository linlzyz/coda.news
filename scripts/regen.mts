import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { regenerate } = await import("../supabase/functions/_shared/regenerate.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
console.log(await regenerate(+process.argv[2] || 4)); await closeDb();
