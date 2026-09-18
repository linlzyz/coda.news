alter table public.events add column if not exists is_rumor boolean not null default false;

-- Recompute aggregates for one event from its articles
create or replace function public.refresh_event(eid bigint) returns void
language sql set search_path = public as $$
  update events e set
    countries      = coalesce((select array_agg(distinct s.country order by s.country) from articles a join sources s on s.id = a.source_id
                               where a.event_id = e.id and s.type <> 'official'), '{}'),
    source_count   = (select count(distinct a.source_id) from articles a where a.event_id = e.id),
    article_count  = (select count(*) from articles a where a.event_id = e.id),
    has_official   = exists (select 1 from articles a join sources s on s.id = a.source_id where a.event_id = e.id and s.type = 'official'),
    started_at     = least(e.started_at, coalesce((select min(a.published_at) from articles a where a.event_id = e.id), e.started_at)),
    last_article_at= greatest(e.last_article_at, coalesce((select max(a.fetched_at) from articles a where a.event_id = e.id), e.last_article_at)),
    image_url      = coalesce(e.image_url, (select a.image_url from articles a join sources s on s.id = a.source_id
                               where a.event_id = e.id and s.type = 'official' and a.image_url is not null limit 1)),
    updated_at     = now()
  where e.id = eid;
$$;

-- Formula scores + status (no AI). Logs changes into event_updates.
create or replace function public.score_events() returns int
language plpgsql set search_path = public as $$
declare r record; n int := 0; new_conf int; new_imp int; new_status text; nc int;
begin
  for r in select * from events where last_article_at > now() - interval '15 days' loop
    nc := coalesce(array_length(r.countries, 1), 0);
    new_conf := least(100, 10 + 12 * least(r.source_count, 5)
                  + case when nc >= 2 then 10 else 0 end + case when nc >= 4 then 5 else 0 end
                  + case when r.has_official then 25 else 0 end);
    if r.is_rumor and not r.has_official then new_conf := least(new_conf, 35); end if;
    new_imp := round(least(r.source_count, 20) / 20.0 * 30 + least(nc, 8) / 8.0 * 30
                  + case when r.has_official then 10 else 0 end + new_conf * 0.1
                  + 20 * exp(-extract(epoch from now() - r.last_article_at) / 86400.0));
    new_status := case
      when now() - r.last_article_at > interval '14 days' then 'archived'
      when now() - r.last_article_at > interval '72 hours' then 'resolved'
      when r.is_rumor and not r.has_official and r.source_count < 3 then 'rumor'
      when now() - r.started_at < interval '6 hours' and r.source_count >= 3 then 'breaking'
      when r.has_official or r.source_count >= 5 then 'confirmed'
      else 'developing' end;
    if new_status <> r.status then
      insert into event_updates (event_id, type, content) values (r.id, 'status_changed', jsonb_build_object('from', r.status, 'to', new_status));
    end if;
    if abs(new_imp - r.importance) >= 15 then
      insert into event_updates (event_id, type, content) values (r.id, 'importance_changed', jsonb_build_object('from', r.importance, 'to', new_imp));
    end if;
    update events set confidence = new_conf, importance = new_imp, status = new_status where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

grant execute on function public.refresh_event, public.score_events to service_role;

alter table public.events add column if not exists dedupe_checked boolean not null default false;
