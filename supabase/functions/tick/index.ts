// Supabase Edge Function, called by pg_cron.
//   POST /functions/v1/tick?step=ingest   every 5 min: fetch RSS
//   POST /functions/v1/tick?step=process  every 5 min: AI processing + narratives + maintenance
//   POST /functions/v1/tick?step=instagram every 10 min: finish Reels; post at 20:00/21:00 Melbourne (own job, so a slow tick never skips the post)
import { fixEnglish } from "../_shared/fixen.ts";
import { tick } from "../_shared/tick.ts";
import { ingest } from "../_shared/ingest.ts";
import { sendDailyBrief } from "../_shared/newsletter.ts";
import { sendFollowAlerts } from "../_shared/follows.ts";
import { briefSingles } from "../_shared/singles.ts";
import { buildStories } from "../_shared/story.ts";
import { refreshIndices } from "../_shared/markets.ts";
import { reviewEvents } from "../_shared/review.ts";
import { sendHealthReport } from "../_shared/health.ts";
import { env } from "../_shared/env.ts";
import { classifyCompanies, enrichCompanies } from "../_shared/companies.ts";
import { auditSample, qaSummary } from "../_shared/qa.ts";
import { checkLinks } from "../_shared/links.ts";
import { finishReels, proposeInstagram } from "../_shared/instagram.ts";

Deno.serve(async (req) => {
  const secret = env("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
  const step = new URL(req.url).searchParams.get("step") ?? "process";
  try {
    const report = step === "ingest" ? await ingest() : step === "brief" ? { brief: await sendDailyBrief(), follows: await sendFollowAlerts(), health: await sendHealthReport() } : step === "companies" ? { companies: await enrichCompanies(20) } : step === "kinds" ? { kinds: await classifyCompanies(120) } : step === "fixen" ? { fixen: await fixEnglish(8) } : step === "igpropose" ? { proposed: await proposeInstagram(true) } : step === "instagram" ? { reels: await finishReels(), proposed: await proposeInstagram() } : step === "links" ? { dead: await checkLinks(60) } : step === "qa" ? { qa: await qaSummary(), sampled: await auditSample(8) } : step === "health" ? { health: await sendHealthReport(true) } : step === "review" ? { review: await reviewEvents(40) } : step === "markets" ? { markets: await refreshIndices(true) } : step === "singles" ? { singles: await briefSingles(15) } : step === "story" ? { story: await buildStories(1, new URL(req.url).searchParams.get("slug") ?? undefined) } : await tick(110_000, { skipIngest: true });
    return Response.json(report);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
