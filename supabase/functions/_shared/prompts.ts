// All AI prompts in one place. Editorial rules live here.

export const TOPICS = ["artificial-intelligence", "semiconductors", "big-tech", "economy", "markets", "trade", "electric-vehicles", "energy", "startups", "crypto",
  "football", "tennis", "cricket", "basketball", "motorsport", "olympic-sports", "film", "music", "tv-streaming", "gaming", "celebrity",
  "luxury", "fashion-week", "fashion-retail", "design", "aviation", "tourism"];
export const CATEGORIES = ["technology", "economy", "sport", "entertainment", "fashion", "travel", "automotive", "gaming"];

export const PREDICATES = [
  "announced", "launched", "released", "acquired", "agreed_to_acquire", "merged_with", "invested_in", "raised_funding",
  "valued_at", "priced_at", "reported_revenue", "reported_profit", "reported_loss", "forecast", "cut_jobs", "hired",
  "opened", "closed", "expanded_to", "partnered_with", "signed_deal_with", "sued", "was_fined", "was_banned",
  "approved", "rejected", "raised_rate", "cut_rate", "held_rate", "imposed_tariff", "restricted_exports",
  "delayed", "recalled", "appointed", "resigned", "stated", "reported_data", "other",
];

export const EDITORIAL_RULES = `
Editorial rules (always follow):
- Coda covers technology, economy/business, sport, entertainment (film, music, TV, games, arts, celebrities), fashion/design, travel, automotive and gaming. No politics, military or crime.
- Celebrity news is reported as what outlets report, attributed to them ("according to People"), never as our own claim. Unconfirmed claims are marked as rumours. Never speculate about health, sexuality or private matters that the person has not made public, and never report on minors' private lives.
- Describe, never judge. Neutral wording. Never use loaded words such as propaganda, regime, biased, spin, lies.
- Each country's perspective comes only from that country's own media. Never speak for a country from another country's sources.
- Report what outlets emphasise; do not say which side is right.
- Do not invent facts, numbers or quotes. Use only the material given.`;

export function extractPrompt(items: { i: number; country: string; source: string; lang: string; title: string; text: string }[]) {
  return `You are the extraction desk of Coda, an event database of technology and economy news.
For each news item below, return structured data. Output English only.
${EDITORIAL_RULES}

For each item decide "relevant": true only if it reports a specific, concrete development in one of Coda's categories:
- technology / economy: announcement, launch, deal, earnings, funding, policy or regulation affecting business, economic data, market move, layoffs, lawsuit, property market
- sport: a result, match, transfer, record, tournament, team or league decision
- entertainment: a release, box office, award, festival, deal, record, casting or industry news; celebrity news such as engagements, weddings, breakups, births, public feuds, statements, red-carpet moments, tours and deaths of public figures
- fashion: a collection, show, designer appointment, brand business news, notable design news
- automotive: carmakers, car and EV launches, car sales, autonomous driving, car industry deals and recalls (use this instead of technology/economy for car stories)
- gaming: video games, game studios and publishers, consoles, esports (use this instead of entertainment/technology for game stories)
- travel: airlines and airports (routes, fares, strikes, safety), tourism numbers, visa and border rules for travellers, hotels and cruises, destinations opening or closing, travel industry news
false for: market roundups, live blogs and "what happened today" digests that cover several unrelated stories, opinion columns, how-to guides, product reviews, shopping deals, horoscopes, quizzes, podcasts, recipes, politics, military, crime and criminal allegations, accidents, weather, anonymous blind items, paparazzi speculation about bodies, health or sexuality.

Fields per relevant item:
- category: one of "technology", "economy", "sport", "entertainment", "fashion", "travel", "automotive", "gaming"
- regions: ISO codes of the country or countries the story is mainly about (e.g. ["AU"], ["US","CN"]), max 3. Not every team, athlete or nation taking part in a multi-nation event, and not the host city of a tournament unless the story is about it
- headline_en: the headline translated to neutral English
- event: one short neutral English sentence naming the specific event (who did what), e.g. "Apple unveils iPhone 18 at September event"
- event_zh: the same event title in natural Simplified Chinese
- brief_zh: one neutral sentence in Simplified Chinese summarising the item
- is_rumor: true if it is unconfirmed (reportedly, sources say, rumour)
- companies: canonical English company names as commonly known (e.g. 苹果/アップル/Apple Inc. -> "Apple"; 英伟达 -> "NVIDIA"; Alphabet's Google news -> "Google"). Max 5.
- topics: 1 to 3 from this list only: ${TOPICS.join(", ")}
- facts: 1 to 5 atomic facts about THIS event only (never about other stories mentioned in passing). Each: {"subject","predicate","object","qualifier","occurred_at","text","text_zh"}.
  predicate must be one of: ${PREDICATES.join(", ")}.
  subject/object are short noun phrases (companies by canonical name). qualifier holds numbers/conditions or "".
  occurred_at is YYYY-MM-DD if known else "". text is the fact as one plain English sentence; text_zh is the same sentence in Simplified Chinese.

Return JSON only: {"items":[{"i":0,"relevant":true,"category":"...","regions":["US"],"headline_en":"...","event":"...","event_zh":"...","brief_zh":"...","is_rumor":false,"companies":[],"topics":[],"facts":[]}]}
For irrelevant items return {"i":N,"relevant":false}.

ITEMS:
${items.map((x) => `### i=${x.i} | ${x.country} | ${x.source} | lang=${x.lang}\nTITLE: ${x.title}\nTEXT: ${x.text}`).join("\n\n")}`;
}

export function verifyPrompt(article: string, candidates: { id: number; title: string }[]) {
  return `Coda groups news articles into events. An event is one specific story: the same announcement, decision, deal, data release or incident,
including its direct follow-up developments. Same broad topic or same company alone is NOT enough.

New article: "${article}"
If the article is a roundup of several unrelated stories, answer null.

Candidate events:
${candidates.map((c) => `- id ${c.id}: ${c.title}`).join("\n")}

Which candidate is the same event as the new article? Return JSON only: {"match": <id or null>}`;
}

export function generatePrompt(input: {
  title: string; facts: string[];
  byCountry: { country: string; items: { source: string; title: string; text: string }[] }[];
  official: { source: string; title: string; text: string }[];
}) {
  return `You are Coda's generation desk. Coda shows how media in different countries report the same event (technology, economy, sport, entertainment, fashion).
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
 "image_person": "full English name of the ONE well-known public figure this story is mainly about (e.g. 'Warren Buffett', 'Taylor Swift', 'Jensen Huang'), or empty string if the story is not about one specific person. Never a private individual or a minor.",
 "image_brand": "the ONE company or brand this story is mainly about, exactly as named among the story's companies (e.g. 'Givenchy' for a Givenchy x Farfetch launch, 'Apple' for an iPhone launch), or empty string if the story is really about a film, show, song, game, product line, person, match or policy rather than the company itself (e.g. a Resident Evil film is not about Sony).",
 "image_query": "2 to 4 English words for a stock photo scene that fits this story. Use the place where it happens if relevant (e.g. 'washington dc capitol', 'seoul gas station', 'tokyo office workers'); otherwise a scene that shows what the story is about ('semiconductor wafer', 'container port', 'zombie horror film' for a horror film, 'fashion runway' for a show). NO company, brand, product or person names. Never a place in a different country from the story.",
 "analysis": "Coda's own take in 2 to 3 sentences, only if there is something genuinely worth saying; otherwise empty string. Lead with the most interesting, non-obvious point: what the coverage reveals, what is missing from it, the context that makes it matter, or what to watch next. Do NOT walk through the countries one by one (the country cards already do that) and avoid stock phrases like 'media in X emphasise', 'coverage is consistent', 'reflects different priorities'. Vary your sentence structure from story to story. Stay neutral: explain, never take sides.",
 "analysis_zh": "the same take written naturally in Simplified Chinese (not a literal translation), or empty string"
}
Include one perspective per country listed under COVERAGE BY COUNTRY, and only those. All *_zh fields are natural Simplified Chinese; for Taiwan and Hong Kong use 中国台湾 and 中国香港.`;
}
