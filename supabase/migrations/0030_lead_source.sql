-- the original article for one-source stories: shown as a compact item with a link to it
alter table public.events add column if not exists lead_url text, add column if not exists lead_source text;
create or replace function public.set_event_lead() returns trigger language plpgsql as $$
begin
  if new.event_id is not null then
    update public.events e set lead_url = new.url, lead_source = (select name from public.sources where id = new.source_id)
    where e.id = new.event_id and e.lead_url is null;
  end if;
  return new;
end $$;
drop trigger if exists articles_event_lead on public.articles;
create trigger articles_event_lead after insert or update of event_id on public.articles for each row execute function public.set_event_lead();
update public.events e set lead_url = a.url, lead_source = a.name
from (select distinct on (a.event_id) a.event_id, a.url, s.name from public.articles a join public.sources s on s.id = a.source_id
      where a.event_id is not null order by a.event_id, a.published_at asc nulls last) a
where a.event_id = e.id and e.lead_url is null;
