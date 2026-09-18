-- Richer company profiles: logo (Wikimedia Commons, free-licence files only), slogan, parent company, social accounts, sector.
alter table public.companies
  add column if not exists logo_url   text,
  add column if not exists slogan     text,
  add column if not exists parent     text,
  add column if not exists parent_zh  text,
  add column if not exists instagram  text,
  add column if not exists x_handle   text,
  add column if not exists facebook   text,
  add column if not exists youtube    text,
  add column if not exists linkedin   text,
  add column if not exists sector     text;   -- technology | finance | automotive | luxury | beauty | fashion | entertainment | sport | energy | retail | industrial | institution
create index if not exists companies_sector_idx on public.companies (sector);
-- re-run enrichment for everyone to fill the new fields
update public.companies set enriched_at = null;
