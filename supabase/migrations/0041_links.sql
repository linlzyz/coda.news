-- original links die (Yahoo syndication expires, pages move): checked daily for one-source stories
alter table public.events add column if not exists link_checked_at timestamptz;
alter table public.articles add column if not exists dead_at timestamptz;
