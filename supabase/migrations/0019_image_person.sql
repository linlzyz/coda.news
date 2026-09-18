-- The one well-known person a story is mainly about; used to find a real, freely licensed portrait (Wikidata P18 on Commons).
alter table public.events add column if not exists image_person text, add column if not exists person_checked_at timestamptz;
