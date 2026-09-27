-- company_stats matched every company against every event (c.id = any(e.company_ids)): a full cross join that now
-- times out for the anon role. Unnest the tags once instead.
create or replace view public.company_stats as
  select c.id as company_id, count(x.event_id)::integer as events, max(x.last_at) as last_at
  from public.companies c
  left join (select unnest(e.company_ids) as company_id, e.id as event_id, e.last_article_at as last_at
             from public.events e where e.summary is not null and e.status <> 'archived') x on x.company_id = c.id
  group by c.id;
