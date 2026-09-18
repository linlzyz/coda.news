-- Remember which Gemini models ran out of daily quota (quota resets at midnight Pacific time), so every run knows to use the fallback.
create table if not exists public.ai_quota (model text primary key, exhausted_on date not null);
alter table public.ai_quota enable row level security;
grant all on public.ai_quota to service_role;
