alter table public.companies add column if not exists country text;   -- ISO 3166-1 alpha-2 from Wikidata
-- per-company news activity, for the companies directory
create or replace view public.company_stats with (security_invoker = on) as
  select c.id as company_id, count(e.id)::int as events, max(e.last_article_at) as last_at
  from public.companies c left join public.events e on c.id = any(e.company_ids) and e.summary is not null and e.status <> 'archived'
  group by c.id;
grant select on public.company_stats to anon, authenticated;
