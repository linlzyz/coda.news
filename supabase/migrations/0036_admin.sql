-- editor controls: pinned picks, blocked images, and a small log of alerts so each is sent once
alter table public.events add column if not exists pinned_at timestamptz, add column if not exists image_blocked text[] not null default '{}';
create table if not exists public.alerts (kind text primary key, sent_at timestamptz not null default now());
alter table public.alerts enable row level security;
