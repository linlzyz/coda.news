import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { refreshIndices } = await import("../supabase/functions/_shared/markets.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
console.log(await refreshIndices(true)); await closeDb();
