-- Coda Anatomy issues stored as data, so a cloud session can publish an issue without a code push.
-- data: the Profile object from src/lib/anatomy.ts, as JSON. publish_at null = draft; the issue goes live when publish_at passes.
-- The tick function's "anatomy" step refreshes the pages once an issue is live (revalidated_at), and again after every edit.
create table if not exists anatomy_profiles (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  no int not null unique,
  data jsonb not null,
  publish_at timestamptz,
  draft_key text not null default replace(gen_random_uuid()::text, '-', ''),
  revalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function anatomy_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists anatomy_touch on anatomy_profiles;
create trigger anatomy_touch before update of data, publish_at, no on anatomy_profiles for each row execute function anatomy_touch();

alter table anatomy_profiles enable row level security;
drop policy if exists anatomy_live_read on anatomy_profiles;
create policy anatomy_live_read on anatomy_profiles for select to anon, authenticated using (publish_at is not null and publish_at <= now());
-- the public key may read live issues, never the draft key
revoke all on anatomy_profiles from anon, authenticated;
grant select (slug, no, data, publish_at, updated_at) on anatomy_profiles to anon, authenticated;

-- draft preview: only with the row's draft key
create or replace function anatomy_draft(p_slug text, p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select data from anatomy_profiles where slug = p_slug and draft_key = p_key and length(p_key) >= 16
$$;

-- every Commons file any issue uses (drafts too), for /anatomy-img
create or replace function anatomy_photo_files() returns setof text
language sql stable security definer set search_path = public as $$
  select distinct f from anatomy_profiles a,
    lateral (select a.data #>> '{cover,file}' as f
             union all select s #>> '{photo,file}' from jsonb_array_elements(coalesce(a.data -> 'sections', '[]'::jsonb)) s) x
  where f is not null
$$;

revoke all on function anatomy_draft(text, text) from public;
revoke all on function anatomy_photo_files() from public;
grant execute on function anatomy_draft(text, text) to anon, authenticated;
grant execute on function anatomy_photo_files() to anon, authenticated;
