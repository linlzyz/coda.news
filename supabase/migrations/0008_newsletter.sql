alter table public.subscribers add column if not exists token uuid not null default gen_random_uuid();
alter table public.subscribers add column if not exists welcomed_at timestamptz;
alter table public.subscribers add column if not exists unsubscribed_at timestamptz;
alter table public.subscribers add column if not exists last_sent_at timestamptz;
create unique index if not exists subscribers_token_idx on public.subscribers (token);

create table if not exists public.newsletter_issues (
  id bigserial primary key,
  sent_on date not null unique,
  event_ids bigint[] not null,
  recipients int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.newsletter_issues enable row level security;
grant all on public.newsletter_issues, public.newsletter_issues_id_seq to service_role;

-- one-click unsubscribe from the website without exposing the table
create or replace function public.unsubscribe(t uuid) returns boolean
language sql security definer set search_path = public as $$
  update subscribers set unsubscribed_at = now() where token = t and unsubscribed_at is null returning true;
$$;
revoke all on function public.unsubscribe(uuid) from public;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

-- allow re-subscribing after unsubscribing (insert conflict)
create or replace function public.subscribe(e text, l text) returns boolean
language sql security definer set search_path = public as $$
  insert into subscribers (email, lang) values (lower(trim(e)), case when l = 'zh' then 'zh' else 'en' end)
  on conflict (email) do update set unsubscribed_at = null, lang = excluded.lang
  returning true;
$$;
revoke all on function public.subscribe(text, text) from public;
grant execute on function public.subscribe(text, text) to anon, authenticated;
