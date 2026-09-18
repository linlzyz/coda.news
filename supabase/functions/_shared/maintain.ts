import { db } from "./db.ts";
import { log } from "./env.ts";

export async function maintain() {
  const sql = db();
  const purged = await sql`update articles set full_text = null where full_text is not null and fetched_at < now() - interval '24 hours' returning id`;
  await sql`update articles set status = 'pending' where status = 'processing' and fetched_at < now() - interval '15 minutes'`;
  const [{ score_events: n }] = await sql`select score_events()`;
  log(`maintain: purged text of ${purged.length} articles, scored ${n} events`);
}
