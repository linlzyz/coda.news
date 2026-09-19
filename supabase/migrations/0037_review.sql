alter table public.events add column if not exists reviewed_at timestamptz, add column if not exists review_note text;
