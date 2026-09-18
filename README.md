# coda.news

```
News is fuel.
Knowledge is the product.

Facts are stored.
Narratives are generated.

Articles are temporary.
Events are permanent.

The database is the product.
The website is just the interface.
```

**Information first. Images second.** Pictures decorate the story. Facts tell the story.

Coda is an event intelligence engine for technology and economy news: every event, and how media in each country report it.

## How it works

Every 5 minutes (Supabase Cron → Edge Function `tick`):

1. **Ingest**: fetch RSS from `sources` (official, wire, media by country). New items become `articles` (pending).
2. **Process**: full text is read for analysis only (purged after 24h) → AI extracts headline, event, companies, topics and atomic facts → multilingual embedding → vector search finds candidate events → AI verifies → article joins an event or starts a new one.
3. **Generate**: when an event gains a second source, AI writes title, summary, agreed facts, per-country perspectives and analysis from stored facts. Cached in the DB, regenerated only on change.
4. **Maintain**: formula scores (confidence, importance, status), dedupe, purge full text.

Editorial rules live in `supabase/functions/_shared/prompts.ts`: describe, never judge; each country's view comes only from its own media; tech and economy only.

## Layout

- `src/` Next.js website (reads with the public key; Row Level Security allows reading published knowledge only)
- `supabase/functions/_shared/` pipeline (runs in Supabase Edge Functions and locally)
- `supabase/migrations/` database schema
- `data/sources.json` news sources (edit, then `npx tsx scripts/seed.mts`)
- `scripts/` local tools: `tick.mts` (run pipeline once), `sql.mts`, `seed.mts`, `schedule.mts`, `dedupe.mts`

## Local development

```
npm install
npm run dev            # website on http://localhost:3000
npx tsx scripts/tick.mts 120   # run the pipeline once
```

Secrets live in `.env.local` (never committed).
