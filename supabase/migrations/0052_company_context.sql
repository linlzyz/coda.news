-- Vercel cost (20 Nov 2026): every company page loaded the whole company directory (about 25,000 rows, 9 MB) twice,
-- because Next's data cache refuses items over 2 MB, and company_stats was paged 25 times per render (statement timeouts).
-- The page only needs its own story count, a few similar companies, its parent and what it owns: return just that.
create or replace function public.company_norm(x text) returns text language sql immutable as $$
  select nullif(regexp_replace(regexp_replace(lower(coalesce(x, '')), '\m(se|sa|inc|group|holding|holdings)\M', '', 'g'), '[^a-z0-9]', '', 'g'), '')
$$;

create or replace function public.company_context(p_id bigint) returns json language sql stable as $$
  with me as (
    select id, sector, country, company_norm(name) as nname, company_norm(parent) as nparent from public.companies where id = p_id
  ),
  pick as (
    select c.id, c.name, c.name_zh, c.slug, c.sector, c.country, c.logo_url, c.kind, c.wikidata_id,
      (me.sector is not null and me.sector <> 'other' and c.sector = me.sector and coalesce(c.kind, 'company') = 'company') as same_sector,
      (me.nparent is not null and company_norm(c.name) = me.nparent) as is_parent,
      (me.nname is not null and c.parent is not null and coalesce(c.kind, '') <> 'org' and company_norm(c.parent) = me.nname) as is_owned
    from public.companies c, me
    where c.id <> me.id
  ),
  hit as (select * from pick where same_sector or is_parent or is_owned),
  st as (
    select x.co, count(*)::int as events
    from (select unnest(e.company_ids) as co from public.events e where e.summary is not null and e.status <> 'archived') x
    where x.co in (select id from hit union all select p_id)
    group by x.co
  ),
  h as (select hit.*, coalesce(st.events, 0) as events from hit left join st on st.co = hit.id)
  select json_build_object(
    'events', coalesce((select events from st where st.co = p_id), 0),
    'similar', coalesce((select json_agg(s) from (
        select h.id, h.name, h.name_zh, h.slug, h.sector, h.country, h.logo_url, h.events from h, me
        where h.same_sector and (h.wikidata_id is not null or h.events >= 3)
        order by (h.country is not distinct from me.country) desc, h.events desc limit 8) s), '[]'),
    'parent', (select row_to_json(p) from (select id, name, name_zh, slug from h where is_parent order by id limit 1) p),
    'owned', coalesce((select json_agg(o) from (select id, name, name_zh, slug from h where is_owned order by id limit 12) o), '[]')
  )
$$;

grant execute on function public.company_norm(text) to anon, authenticated;
grant execute on function public.company_context(bigint) to anon, authenticated;
