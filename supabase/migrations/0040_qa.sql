-- daily quality sampling: a stronger model re-checks random published stories; the error rate goes into the morning email
create table if not exists public.qa_checks (
  id bigserial primary key,
  event_id bigint references public.events(id) on delete cascade,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  issues jsonb not null default '[]'::jsonb
);
create index if not exists qa_checks_at on public.qa_checks (checked_at desc);
alter table public.qa_checks enable row level security;
