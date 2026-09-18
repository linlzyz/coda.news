-- Cheap first pass on title + RSS summary, and a record of paid AI spend with a daily cap.
alter table public.articles add column if not exists screen text, add column if not exists screened_at timestamptz;   -- keep | unsure | drop | rule
create index if not exists articles_screen_idx on public.articles (status, screened_at);
create table if not exists public.ai_usage (
  day date not null, model text not null,
  in_tokens bigint not null default 0, out_tokens bigint not null default 0, usd numeric(10,4) not null default 0, calls int not null default 0,
  primary key (day, model)
);
alter table public.ai_usage enable row level security;
grant all on public.ai_usage to service_role;
