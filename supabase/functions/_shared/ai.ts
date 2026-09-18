// AI provider adapter. V1: Google Gemini (free tier). Swap providers here only.
import { env, log } from "./env.ts";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const MODELS = {
  fast: () => env("AI_MODEL_FAST", "gemini-3.5-flash-lite"),   // extraction, verification
  smart: () => env("AI_MODEL_SMART", "gemini-3.5-flash"),      // summaries, perspectives
  embed: () => env("AI_MODEL_EMBED", "gemini-embedding-001"),
};
export const EMBED_DIM = 768;

export class RateLimited extends Error {}

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
      if (attempt < 2) { await new Promise((s) => setTimeout(s, 8000 * (attempt + 1))); continue; }
      throw new RateLimited(`AI rate limited: ${text.slice(0, 200)}`);
    }
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
  const model = MODELS[tier]();
  const t0 = Date.now();
  const j = await call(`${model}:generateContent`, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 16384 },
  });
  const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  log(`ai ${model} ${Date.now() - t0}ms in=${j.usageMetadata?.promptTokenCount} out=${j.usageMetadata?.candidatesTokenCount}`);
  try { return JSON.parse(text) as T; } catch { /* try a looser parse */ }
  try { return parseLoose(text) as T; } catch { throw new BadJSON(`AI returned malformed JSON (${j.candidates?.[0]?.finishReason})`); }
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
