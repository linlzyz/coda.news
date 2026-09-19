-- Removed stories stay removed. Status is recalculated by score_events() (which used to turn "archived" back into "developing"),
-- so an editorial removal is now its own flag that nothing automatic touches.
alter table public.events add column if not exists hidden boolean not null default false;
update public.events set hidden = true where status = 'archived' and last_article_at > now() - interval '14 days';
create index if not exists events_visible on public.events (last_article_at desc) where not hidden;
