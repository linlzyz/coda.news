alter table public.companies add column if not exists founders text, add column if not exists founders_zh text, add column if not exists ceo_zh text;
update public.companies set enriched_at = null;
