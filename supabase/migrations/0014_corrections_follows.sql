-- Public corrections log, and email follows for companies and topics.
create table if not exists public.corrections (
  id bigserial primary key,
  event_id bigint references public.events(id) on delete set null,
  event_slug text, event_title text,
  kind text not null,                 -- removed_articles | removed_facts | merged | reader_report | editorial
  detail_en text not null, detail_zh text,
  created_at timestamptz not null default now()
);
create index if not exists corrections_created_idx on public.corrections (created_at desc);
create index if not exists corrections_event_idx on public.corrections (event_id);
alter table public.corrections enable row level security;
grant select on public.corrections to anon, authenticated;
grant all on public.corrections, public.corrections_id_seq to service_role;
drop policy if exists "public read" on public.corrections;
create policy "public read" on public.corrections for select to anon, authenticated using (true);

create table if not exists public.follows (
  id bigserial primary key,
  email text not null,
  lang text not null default 'en',
  company_id bigint references public.companies(id) on delete cascade,
  topic_id bigint references public.topics(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  confirm_sent_at timestamptz, confirmed_at timestamptz, unsubscribed_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  check ((company_id is null) <> (topic_id is null))
);
create unique index if not exists follows_uniq on public.follows (email, coalesce(company_id, 0), coalesce(topic_id, 0));
create unique index if not exists follows_token on public.follows (token);
alter table public.follows enable row level security;
grant all on public.follows, public.follows_id_seq to service_role;

create or replace function public.follow(e text, l text, cid bigint, tid bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare em text := lower(trim(e));
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(em) > 254 or ((cid is null) = (tid is null)) then return false; end if;
  -- a little abuse protection: at most 20 follows per address
  if (select count(*) from follows where email = em) >= 20 then return false; end if;
  insert into follows (email, lang, company_id, topic_id) values (em, case when l = 'zh' then 'zh' else 'en' end, cid, tid)
  on conflict (email, coalesce(company_id, 0), coalesce(topic_id, 0))
  do update set unsubscribed_at = null, lang = excluded.lang,
     confirm_sent_at = case when follows.confirmed_at is null then null else follows.confirm_sent_at end;
  return true;
end $$;
revoke all on function public.follow(text, text, bigint, bigint) from public;
grant execute on function public.follow(text, text, bigint, bigint) to anon, authenticated;

create or replace function public.confirm_follow(t uuid) returns boolean
language sql security definer set search_path = public as $$
  update follows set confirmed_at = coalesce(confirmed_at, now()), unsubscribed_at = null, last_sent_at = coalesce(last_sent_at, now())
  where token = t returning true;
$$;
revoke all on function public.confirm_follow(uuid) from public;
grant execute on function public.confirm_follow(uuid) to anon, authenticated;

create or replace function public.unfollow(t uuid) returns boolean
language sql security definer set search_path = public as $$
  update follows set unsubscribed_at = now() where token = t returning true;
$$;
revoke all on function public.unfollow(uuid) from public;
grant execute on function public.unfollow(uuid) to anon, authenticated;
