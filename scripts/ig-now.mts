// Post tonight's Instagram now (same picker as the 20:00 run): npx tsx scripts/ig-now.mts
import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const ig = await import("../supabase/functions/_shared/instagram.ts");
console.log("proposed", await ig.proposeInstagram(true));
await (await import("../supabase/functions/_shared/db.ts")).closeDb();
