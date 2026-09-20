-- pilot requests from coda.news/business; the pipeline emails business@ and confirms to the applicant
create table if not exists public.pilot_requests (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  name text, company text not null, email text not null, brands text, note text, lang text default 'en',
  notified_at timestamptz
);
alter table public.pilot_requests enable row level security;
create or replace function public.request_pilot(n text, c text, e text, b text, x text, l text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(c), '') = '' or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return false; end if;
  -- at most 3 requests per address a day (spam guard)
  if (select count(*) from pilot_requests where lower(email) = lower(trim(e)) and created_at > now() - interval '1 day') >= 3 then return true; end if;
  insert into pilot_requests (name, company, email, brands, note, lang)
  values (left(n, 120), left(c, 160), lower(trim(e)), left(b, 400), left(x, 1500), case when l = 'zh' then 'zh' else 'en' end);
  return true;
end $$;
revoke all on function public.request_pilot(text, text, text, text, text, text) from public;
grant execute on function public.request_pilot(text, text, text, text, text, text) to anon, authenticated;
