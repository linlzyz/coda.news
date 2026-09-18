-- New sections: sport, entertainment, fashion (categories) and Australia (region)
alter table public.events drop constraint if exists events_category_check;
alter table public.events add constraint events_category_check check (category in ('technology','economy','sport','entertainment','fashion'));
alter table public.events add column if not exists regions text[] not null default '{}';   -- where the event happens (ISO codes)
create index if not exists events_regions_idx on public.events using gin (regions);
alter table public.sources add column if not exists priority smallint not null default 1;  -- 1 = tech/economy first, 2 = new sections

insert into public.topics (name, slug, color) values
 ('Football','football','#15803D'), ('Tennis','tennis','#65A30D'), ('Cricket','cricket','#0F766E'), ('Basketball','basketball','#EA580C'),
 ('Motorsport','motorsport','#DC2626'), ('Olympic Sports','olympic-sports','#2563EB'),
 ('Film','film','#7C3AED'), ('Music','music','#DB2777'), ('TV & Streaming','tv-streaming','#9333EA'), ('Gaming','gaming','#4F46E5'),
 ('Luxury','luxury','#A16207'), ('Fashion Week','fashion-week','#BE185D'), ('Fashion Retail','fashion-retail','#B45309'), ('Design','design','#475569')
on conflict (slug) do nothing;
