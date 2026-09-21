// AI provider adapter. Google Gemini (free tier) first; when every Gemini model is out of daily quota, Groq (free tier) takes over.
import { env, log } from "./env.ts";
import { db } from "./db.ts";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Free tier quotas are per model per day, so each tier has a fallback chain.
export const MODELS = {
  fast: () => env("AI_MODELS_FAST", "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.6-flash,gemini-3.5-flash").split(","),   // extraction, verification
  smart: () => env("AI_MODELS_SMART", "gemini-3.5-flash,gemini-3.6-flash,gemini-3.7-flash,gemini-3.1-flash-lite").split(","),     // summaries, perspectives
  embed: () => env("AI_MODEL_EMBED", "gemini-embedding-001"),
};
const exhausted = new Set<string>();   // models out of daily quota (loaded from the DB once per run)
const pacificDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
let loaded = false;
async function loadExhausted() {
  if (loaded) return; loaded = true;
  try { for (const r of await db()<{ model: string }[]>`select model from ai_quota where exhausted_on = ${pacificDay()}`) exhausted.add(r.model); } catch { /* table missing: ignore */ }
}
async function markExhausted(m: string) {
  exhausted.add(m);
  try { await db()`insert into ai_quota (model, exhausted_on) values (${m}, ${pacificDay()}) on conflict (model) do update set exhausted_on = excluded.exhausted_on`; } catch { /* ignore */ }
}
export const EMBED_DIM = 768;

export class RateLimited extends Error {}
class QuotaExhausted extends Error {}
class NotFound extends Error {}

// deno-lint-ignore no-explicit-any
async function call(path: string, body: unknown, timeoutMs = 90000) {
  const key = env("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY missing");
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${BASE}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (r.ok) return await r.json();
    const text = await r.text();
    if (r.status === 429) {
      if (/PerDay/i.test(text)) throw new QuotaExhausted(text.slice(0, 120));
      if (attempt < 2) { await new Promise((s) => setTimeout(s, 8000 * (attempt + 1))); continue; }
      throw new RateLimited(`AI rate limited: ${text.slice(0, 200)}`);
    }
    if (r.status === 404) throw new NotFound(text.slice(0, 120));
    if (r.status >= 500 && attempt < 2) { await new Promise((s) => setTimeout(s, 3000)); continue; }
    throw new Error(`AI ${r.status}: ${text.slice(0, 300)}`);
  }
  throw new Error("AI failed");
}

/** Ask the model for JSON. Returns parsed object. Retries once if the JSON is malformed. */
export async function generateJSON<T = unknown>(prompt: string, tier: "fast" | "smart" = "fast"): Promise<T> {
  try { return await generateOnce<T>(prompt, tier); }
  catch (e) { if (e instanceof BadJSON) return await generateOnce<T>(prompt, tier); throw e; }
}
class BadJSON extends Error {}
function parseLoose(text: string) {
  const m = text.match(/[\[{][\s\S]*[\]}]/); const t = (m ? m[0] : text).replace(/,\s*([\]}])/g, "$1");
  return JSON.parse(t);
}
async function generateOnce<T>(prompt: string, tier: "fast" | "smart"): Promise<T> {
  const t0 = Date.now();
  await loadExhausted();
  let j: any = null, model = "";
  for (const m of MODELS[tier]().filter((m) => !exhausted.has(m))) {
    try {
      model = m;
      j = await call(`${m}:generateContent`, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 16384 },
      });
      break;
    } catch (e) {
      if (e instanceof QuotaExhausted) { await markExhausted(m); log(`ai ${m} out of daily quota, trying next model`); continue; }
      if (e instanceof NotFound) { exhausted.add(m); log(`ai ${m} not found, trying next model`); continue; }
      if (e instanceof RateLimited) { log(`ai ${m} busy (per-minute limit), trying next model`); continue; }
      throw e;
    }
  }
  let text: string;
  if (j) {
    text = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    log(`ai ${model} ${Date.now() - t0}ms in=${j.usageMetadata?.promptTokenCount} out=${j.usageMetadata?.candidatesTokenCount}`);
  } else {
    text = (await openai(prompt).catch((e) => { log("ai openai:", (e as Error).message.slice(0, 120)); return null; })) ?? await groq(prompt);
  }
  try { return JSON.parse(text) as T; } catch { /* try a looser parse */ }
  try { return parseLoose(text) as T; } catch { throw new BadJSON(`AI returned malformed JSON (${j?.candidates?.[0]?.finishReason ?? "groq"})`); }
}

// ---- OpenAI (paid, cheap): gpt-5-nano. Every call is metered in ai_usage and stops at a daily dollar cap. ----
const PRICE: Record<string, [number, number]> = { "gpt-5-nano": [0.05, 0.40], "gpt-5-mini": [0.25, 2.0], "text-embedding-3-small": [0.02, 0] };
const utcDay = () => new Date().toISOString().slice(0, 10);
export async function spentToday(): Promise<number> {
  try { const [r] = await db()<{ usd: string }[]>`select coalesce(sum(usd), 0)::text as usd from ai_usage where day = ${utcDay()}`; return Number(r?.usd ?? 0); } catch { return 0; }
}
async function meter(model: string, inTok: number, outTok: number) {
  const [pi, po] = PRICE[model] ?? [0, 0];
  const usd = (inTok * pi + outTok * po) / 1e6;
  try { await db()`insert into ai_usage (day, model, in_tokens, out_tokens, usd, calls) values (${utcDay()}, ${model}, ${inTok}, ${outTok}, ${usd}, 1)
    on conflict (day, model) do update set in_tokens = ai_usage.in_tokens + excluded.in_tokens, out_tokens = ai_usage.out_tokens + excluded.out_tokens,
      usd = ai_usage.usd + excluded.usd, calls = ai_usage.calls + 1`; } catch { /* ignore */ }
}
const dailyCap = () => Number(env("OPENAI_DAILY_USD", "0.30"));   // about $9 a month at most
export async function openai(prompt: string, model = "gpt-5-nano", maxOut = 12000, effort: "minimal" | "low" = "minimal"): Promise<string> {
  const key = env("OPENAI_API_KEY"); if (!key) throw new Error("no OPENAI_API_KEY");
  if (await spentToday() >= dailyCap()) throw new RateLimited("OpenAI daily budget reached");
  const t0 = Date.now();
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(120000),
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, reasoning_effort: effort, response_format: { type: "json_object" }, max_completion_tokens: maxOut,
      messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) {
    const t = await r.text();
    // no credit left on the account: remember it so the alert email can say exactly what to do
    if (/insufficient_quota|credit_balance_exhausted/.test(t)) {
      try { await db()`insert into app_settings (key, value, updated_at) values ('openai_error', 'no_credit', now()) on conflict (key) do update set value = excluded.value, updated_at = now()`; } catch { /* ignore */ }
      throw new RateLimited("OpenAI account has no credit left");
    }
    throw new Error(`openai ${r.status}: ${t.slice(0, 160)}`);
  }
  const j = await r.json();
  await meter(model, j.usage?.prompt_tokens ?? 0, j.usage?.completion_tokens ?? 0);
  log(`ai openai ${model} ${Date.now() - t0}ms in=${j.usage?.prompt_tokens} out=${j.usage?.completion_tokens}`);
  return j.choices?.[0]?.message?.content ?? "";
}
/** Cheap JSON for small, high-volume jobs (screening): OpenAI nano first, then Groq, then Gemini. */
export async function cheapJSON<T = unknown>(prompt: string): Promise<T> {
  let text: string | null = null;
  try { text = await openai(prompt, "gpt-5-nano", 6000, "low"); } catch (e) { log("cheap: openai", (e as Error).message.slice(0, 100)); }
  if (text === null) { try { text = await groq(prompt); } catch (e) { log("cheap: groq", (e as Error).message.slice(0, 100)); } }
  if (text === null) return generateJSON<T>(prompt, "fast");
  try { return JSON.parse(text) as T; } catch { return parseLoose(text) as T; }
}

/** True once every Gemini model is out of quota in this run: callers should send smaller batches (Groq free tier: ~8k tokens/min per model). */
/** true while at least one free Gemini model of this tier still has quota today */
export const geminiFree = async (tier: "fast" | "smart" = "smart") => { await loadExhausted(); return MODELS[tier]().some((m) => !exhausted.has(m)); };
export const onFallback = async () => {
  await loadExhausted();
  if (!MODELS.fast().every((m) => exhausted.has(m))) return false;
  return !env("OPENAI_API_KEY") || (await spentToday()) >= dailyCap();   // nano handles normal batches; only Groq needs small ones
};

// ---- Groq (OpenAI-compatible). Free tier: 1,000 requests/day and ~8,000 tokens/min per model, so we rotate models. ----
const GROQ_MODELS = () => env("AI_MODELS_GROQ", "openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b").split(",");
const groqOut = new Set<string>();
const groqTokensLeft = new Map<string, number>();
async function groq(prompt: string): Promise<string> {
  const key = env("GROQ_API_KEY");
  if (!key) throw new RateLimited("all Gemini models are out of daily quota and GROQ_API_KEY is not set");
  const need = Math.ceil(prompt.length / 3.2) + 2500;   // rough input + output tokens
  const models = GROQ_MODELS().filter((m) => !groqOut.has(m)).sort((a, b) => (groqTokensLeft.get(b) ?? 8000) - (groqTokensLeft.get(a) ?? 8000));
  for (const m of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now();
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: m, messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: Math.min(6000, Math.max(1500, 8000 - need + 2500)),
          response_format: { type: "json_object" } }),
      });
      const left = Number(r.headers.get("x-ratelimit-remaining-tokens")); if (!isNaN(left)) groqTokensLeft.set(m, left);
      if (r.ok) {
        const j = await r.json();
        log(`ai groq ${m} ${Date.now() - t0}ms in=${j.usage?.prompt_tokens} out=${j.usage?.completion_tokens}`);
        return j.choices?.[0]?.message?.content ?? "";
      }
      const body = await r.text();
      if (r.status === 413 || /too large|reduce your message/i.test(body)) { log(`ai groq ${m}: prompt too large`); break; }
      if (r.status === 429) {
        if (/per day|RPD|TPD/i.test(body) || r.headers.get("x-ratelimit-remaining-requests") === "0") { groqOut.add(m); break; }
        const wait = Math.min(20, Number(r.headers.get("retry-after")) || 10);
        if (attempt === 0) { await new Promise((s) => setTimeout(s, wait * 1000)); continue; }
        break;   // still limited this minute: try another model
      }
      if (r.status === 404 || r.status === 400 && /model/i.test(body)) { groqOut.add(m); break; }
      throw new Error(`AI groq ${r.status}: ${body.slice(0, 200)}`);
    }
  }
  throw new RateLimited("all AI models are out of quota for now");
}

/** Multilingual embeddings, 768 dims: OpenAI text-embedding-3-small (no daily cap, ~$0.02 per million tokens). */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const key = env("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY missing (embeddings)");
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 200) {
    const chunk = texts.slice(i, i + 200).map((t) => t.slice(0, 6000) || " ");
    const r = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST", signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: chunk, dimensions: EMBED_DIM }),
    });
    if (!r.ok) {
      const t = await r.text();
      if (/insufficient_quota|credit_balance_exhausted/.test(t)) {
        try { await db()`insert into app_settings (key, value, updated_at) values ('openai_error', 'no_credit', now()) on conflict (key) do update set value = excluded.value, updated_at = now()`; } catch { /* ignore */ }
        throw new Error("embeddings: OpenAI account has no credit left");
      }
      throw new Error(`embeddings ${r.status}: ${t.slice(0, 160)}`);
    }
    const j = await r.json();
    await meter("text-embedding-3-small", j.usage?.prompt_tokens ?? 0, 0);
    // deno-lint-ignore no-explicit-any
    for (const d of (j.data as any[]).sort((x, y) => x.index - y.index)) out.push(normalize(d.embedding));
  }
  return out;
}
function normalize(v: number[]) { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); }
