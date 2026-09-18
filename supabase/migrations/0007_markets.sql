create table if not exists public.market_series (
  name       text primary key,
  grp        text not null default 'indices',
  sort       int not null default 0,
  value      double precision not null,
  change     double precision not null,
  series     jsonb not null default '[]',
  digits     int not null default 2,
  as_of      date,
  updated_at timestamptz not null default now()
);
alter table public.market_series enable row level security;
grant select on public.market_series to anon, authenticated;
grant all on public.market_series to service_role;
drop policy if exists "public read" on public.market_series;
create policy "public read" on public.market_series for select to anon, authenticated using (true);
