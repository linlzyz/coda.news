-- Company profiles from Wikidata (CC0) and Wikipedia summaries (CC BY-SA, attributed on the page).
alter table public.companies
  add column if not exists wikidata_id  text,
  add column if not exists name_zh      text,
  add column if not exists description_zh text,
  add column if not exists about_en     text,
  add column if not exists about_zh     text,
  add column if not exists founded      int,
  add column if not exists hq           text,
  add column if not exists hq_zh        text,
  add column if not exists industry     text,
  add column if not exists industry_zh  text,
  add column if not exists ceo          text,
  add column if not exists ticker       text,
  add column if not exists wikipedia_en text,
  add column if not exists wikipedia_zh text,
  add column if not exists enriched_at  timestamptz;
