alter table public.events add column if not exists image_query text;
alter table public.events add column if not exists image_link text;      -- photographer / source page (credit link)
alter table public.events add column if not exists image_checked_at timestamptz;

create table if not exists public.subscribers (
  id bigserial primary key,
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  lang text not null default 'en',
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
grant insert on public.subscribers to anon, authenticated;
grant usage on sequence public.subscribers_id_seq to anon, authenticated;
grant all on public.subscribers to service_role;
drop policy if exists "anyone can subscribe" on public.subscribers;
create policy "anyone can subscribe" on public.subscribers for insert to anon, authenticated with check (true);
