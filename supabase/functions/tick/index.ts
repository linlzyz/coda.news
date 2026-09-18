// Supabase Edge Function, called by pg_cron.
//   POST /functions/v1/tick?step=ingest   every 5 min: fetch RSS
//   POST /functions/v1/tick?step=process  every 5 min: AI processing + narratives + maintenance
import { tick } from "../_shared/tick.ts";
import { ingest } from "../_shared/ingest.ts";
import { sendDailyBrief } from "../_shared/newsletter.ts";
import { env } from "../_shared/env.ts";

Deno.serve(async (req) => {
  const secret = env("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
  const step = new URL(req.url).searchParams.get("step") ?? "process";
  try {
    const report = step === "ingest" ? await ingest() : step === "brief" ? { brief: await sendDailyBrief() } : await tick(135_000, { skipIngest: true });
    return Response.json(report);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
