// All AI prompts in one place. Editorial rules live here.

export const TOPICS = ["artificial-intelligence", "semiconductors", "big-tech", "economy", "markets", "trade", "electric-vehicles", "energy", "startups", "crypto"];

export const PREDICATES = [
  "announced", "launched", "released", "acquired", "agreed_to_acquire", "merged_with", "invested_in", "raised_funding",
  "valued_at", "priced_at", "reported_revenue", "reported_profit", "reported_loss", "forecast", "cut_jobs", "hired",
  "opened", "closed", "expanded_to", "partnered_with", "signed_deal_with", "sued", "was_fined", "was_banned",
  "approved", "rejected", "raised_rate", "cut_rate", "held_rate", "imposed_tariff", "restricted_exports",
  "delayed", "recalled", "appointed", "resigned", "stated", "reported_data", "other",
];

export const EDITORIAL_RULES = `
Editorial rules (always follow):
- Coda covers technology and economy/business only. No politics, military, crime, social issues, sport or entertainment.
- Describe, never judge. Neutral wording. Never use loaded words such as propaganda, regime, biased, spin, lies.
- Each country's perspective comes only from that country's own media. Never speak for a country from another country's sources.
- Report what outlets emphasise; do not say which side is right.
- Do not invent facts, numbers or quotes. Use only the material given.`;

export function extractPrompt(items: { i: number; country: string; source: string; lang: string; title: string; text: string }[]) {
  return `You are the extraction desk of Coda, an event database of technology and economy news.
For each news item below, return structured data. Output English only.
${EDITORIAL_RULES}

For each item decide "relevant": true only if it reports a specific, concrete technology or business/economy development
(announcement, launch, deal, earnings, funding, policy/regulation affecting business, economic data, market move, layoffs, lawsuit, etc).
false for: opinion/analysis columns, how-to guides, product reviews, shopping deals, podcasts, lifestyle, politics, military, crime, sport, weather.

Fields per relevant item:
- category: "technology" or "economy"
- headline_en: the headline translated to neutral English
- event: one short neutral English sentence naming the specific event (who did what), e.g. "Apple unveils iPhone 18 at September event"
- event_zh: the same event title in natural Simplified Chinese
- brief_zh: one neutral sentence in Simplified Chinese summarising the item
- is_rumor: true if it is unconfirmed (reportedly, sources say, rumour)
- companies: canonical English company names as commonly known (e.g. 苹果/アップル/Apple Inc. -> "Apple"; 英伟达 -> "NVIDIA"; Alphabet's Google news -> "Google"). Max 5.
- topics: 1 to 3 from this list only: ${TOPICS.join(", ")}
- facts: 1 to 5 atomic facts. Each: {"subject","predicate","object","qualifier","occurred_at","text"}.
  predicate must be one of: ${PREDICATES.join(", ")}.
  subject/object are short noun phrases (companies by canonical name). qualifier holds numbers/conditions or "".
  occurred_at is YYYY-MM-DD if known else "". text is the fact as one plain English sentence.

Return JSON only: {"items":[{"i":0,"relevant":true,"category":"...","headline_en":"...","event":"...","event_zh":"...","brief_zh":"...","is_rumor":false,"companies":[],"topics":[],"facts":[]}]}
For irrelevant items return {"i":N,"relevant":false}.

ITEMS:
${items.map((x) => `### i=${x.i} | ${x.country} | ${x.source} | lang=${x.lang}\nTITLE: ${x.title}\nTEXT: ${x.text}`).join("\n\n")}`;
}

export function verifyPrompt(article: string, candidates: { id: number; title: string }[]) {
  return `Coda groups news articles into events. An event is one specific story: the same announcement, decision, deal, data release or incident,
including its direct follow-up developments. Same broad topic or same company alone is NOT enough.

New article: "${article}"

Candidate events:
${candidates.map((c) => `- id ${c.id}: ${c.title}`).join("\n")}

Which candidate is the same event as the new article? Return JSON only: {"match": <id or null>}`;
}

export function generatePrompt(input: {
  title: string; facts: string[];
  byCountry: { country: string; items: { source: string; title: string; text: string }[] }[];
  official: { source: string; title: string; text: string }[];
}) {
  return `You are Coda's generation desk. Coda shows how media in different countries report the same technology/economy event.
Write from the material below only.
${EDITORIAL_RULES}

EVENT: ${input.title}

KNOWN FACTS:
${input.facts.map((f) => "- " + f).join("\n") || "(none yet)"}

OFFICIAL / PRIMARY SOURCES:
${input.official.map((o) => `- ${o.source}: ${o.title}\n  ${o.text}`).join("\n") || "(none)"}

COVERAGE BY COUNTRY:
${input.byCountry.map((c) => `## ${c.country}\n${c.items.map((i) => `- ${i.source}: ${i.title}\n  ${i.text}`).join("\n")}`).join("\n\n")}

Return JSON only:
{
 "title": "neutral English event title, max 90 chars, no clickbait",
 "title_zh": "same title in Simplified Chinese",
 "summary": "2 to 3 neutral English sentences: what happened, key numbers, why it matters",
 "summary_zh": "same summary in Simplified Chinese",
 "agreed": ["2 to 4 short facts that all or nearly all sources report"],
 "agreed_zh": ["the same facts in Simplified Chinese"],
 "perspectives": [ { "country": "US", "headline": "typical headline from this country's media, in English",
     "framing": "2 to 3 word label for the angle, e.g. Market opportunity",
     "emphasis": "one sentence: what this country's coverage puts first",
     "downplayed": "one sentence: what it mentions less or leaves out, or empty string",
     "tone": "positive|neutral|negative",
     "headline_zh": "...", "framing_zh": "...", "emphasis_zh": "...", "downplayed_zh": "..." } ],
 "image_query": "2 to 4 generic English words for a stock photo scene that fits this story, with NO company, brand, product or person names (e.g. 'tokyo financial district', 'semiconductor wafer', 'container port')",
 "analysis": "if 2+ countries: 2 to 3 neutral sentences on why coverage differs (interests, audience, industry exposure). Else empty string.",
 "analysis_zh": "the analysis in Simplified Chinese, or empty string"
}
Include one perspective per country listed under COVERAGE BY COUNTRY, and only those. All *_zh fields are natural Simplified Chinese; for Taiwan and Hong Kong use 中国台湾 and 中国香港.`;
}
