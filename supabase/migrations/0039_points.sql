-- key points shown when a one-source story is expanded in the list (no separate page needed)
alter table public.events add column if not exists points jsonb;
update public.events e set points = jsonb_build_object('en', u.content->'agreed', 'zh', u.content->'agreed_zh')
from (select distinct on (event_id) event_id, content from public.event_updates where type = 'summary_updated' order by event_id, created_at desc) u
where u.event_id = e.id and e.source_count < 2 and jsonb_array_length(coalesce(u.content->'agreed', '[]'::jsonb)) > 0;
