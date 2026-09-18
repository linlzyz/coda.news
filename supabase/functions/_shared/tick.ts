// One pipeline run. Called every 5 minutes. Stops before the time budget runs out.
import { ingest } from "./ingest.ts";
import { processBatch } from "./process.ts";
import { regenerate } from "./regenerate.ts";
import { maintain } from "./maintain.ts";
import { dedupe } from "./dedupe.ts";
import { auditEvents } from "./audit.ts";
import { assignImages } from "./images.ts";
import { enrichCompanies } from "./companies.ts";
import { screenArticles } from "./screen.ts";
import { translateFacts, translateMissing } from "./translate.ts";
import { refreshIndices } from "./markets.ts";
import { sendWelcomes } from "./newsletter.ts";
import { sendFollowConfirmations } from "./follows.ts";
import { pingIndexNow } from "./indexnow.ts";
import { RateLimited } from "./ai.ts";
import { log } from "./env.ts";

export async function tick(budgetMs = 120_000, opts: { skipIngest?: boolean } = {}) {
  const t0 = Date.now(); const left = () => budgetMs - (Date.now() - t0);
  const report: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try { report[name] = await fn(); }
    catch (e) { report[name] = { error: (e as Error).message.slice(0, 300) }; log(`${name} error:`, (e as Error).message); if (e instanceof RateLimited) throw e; }
  };
  try {
    if (!opts.skipIngest) await step("ingest", ingest);
    await step("screen", () => screenArticles(360));
    let batches = 0;
    while (left() > 45_000) {
      let r: { claimed: number } | undefined;
      await step(`process${batches}`, async () => (r = await processBatch()));
      batches++;
      if (!r || r.claimed === 0) break;
    }
    if (left() > 40_000) await step("dedupe", () => dedupe(6));
    if (left() > 35_000) await step("audit", () => auditEvents(2));
    if (left() > 30_000) await step("regenerate", () => regenerate(left() > 80_000 ? 4 : 2));
  } catch (e) { report.stopped = (e as Error).message.slice(0, 200); }
  if (left() > 20_000) await step("translate", () => translateMissing(30));
  if (left() > 15_000) await step("translateFacts", () => translateFacts(60));
  if (left() > 10_000) await step("images", () => assignImages(12));
  if (left() > 8_000) await step("companies", () => enrichCompanies(25));
  await step("markets", () => refreshIndices());
  await step("welcome", sendWelcomes);
  await step("followConfirm", sendFollowConfirmations);
  await step("indexnow", pingIndexNow);
  await step("maintain", maintain);
  report.ms = Date.now() - t0;
  return report;
}
