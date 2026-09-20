-- English quality pass: headlines, summaries and key points where Chinese/Japanese/Korean text slipped into the English
alter table public.events add column if not exists en_checked_at timestamptz;
