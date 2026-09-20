-- Instagram auto-posting: the token lives here (refreshed by the pipeline), one row per proposed post
create table if not exists public.app_settings (key text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.app_settings enable row level security;
create table if not exists public.ig_posts (
  id bigserial primary key,
  event_id bigint references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'pending',   -- pending | approved | posted | skipped | failed
  approve_token uuid not null default gen_random_uuid(),
  caption text, media_id text, permalink text, error text, posted_at timestamptz
);
alter table public.ig_posts enable row level security;
