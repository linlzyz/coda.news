import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
const { assignImages } = await import("../supabase/functions/_shared/images.ts");
const { closeDb } = await import("../supabase/functions/_shared/db.ts");
let t = 0; for (let i = 0; i < (+process.argv[2] || 5); i++) t += await assignImages(25);
console.log("images", t); await closeDb();
