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
    text = await groq(prompt);   // throws RateLimited when Groq is out too
  }
  try { return JSON.parse(text) as T; } catch { /* try a looser parse */ }
  try { return parseLoose(text) as T; } catch { throw new BadJSON(`AI returned malformed JSON (${j?.candidates?.[0]?.finishReason ?? "groq"})`); }
}

/** True once every Gemini model is out of quota in this run: callers should send smaller batches (Groq free tier: ~8k tokens/min per model). */
export const onFallback = async () => { await loadExhausted(); return MODELS.fast().every((m) => exhausted.has(m)); };

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

/** Multilingual embeddings, 768 dims. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const model = MODELS.embed();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 50) {
    const chunk = texts.slice(i, i + 50);
    const j = await call(`${model}:batchEmbedContents`, {
      requests: chunk.map((t) => ({
        model: `models/${model}`,
        content: { parts: [{ text: t.slice(0, 6000) }] },
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: EMBED_DIM,
      })),
    });
    for (const e of j.embeddings) out.push(normalize(e.values));
  }
  return out;
}
function normalize(v: number[]) { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); }
