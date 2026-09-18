alter table public.perspectives add column if not exists headline_zh text;
alter table public.perspectives add column if not exists framing_zh text;
alter table public.perspectives add column if not exists emphasis_zh text;
alter table public.perspectives add column if not exists downplayed_zh text;
grant select on public.perspectives to anon, authenticated;
