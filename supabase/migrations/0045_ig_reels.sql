-- Instagram: some posts go out as Reels (video processed asynchronously) and every post also gets a Story
alter table public.ig_posts add column if not exists format text not null default 'carousel',
  add column if not exists container_id text, add column if not exists story_id text;
-- the slide/video renderer reads only these display fields for one post
create or replace function public.ig_slide(p bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('slug', e.slug, 'kind', x.kind, 'format', x.format, 'img', x.img_url, 'credit', x.img_credit, 'copy', x.copy)
  from ig_posts x join events e on e.id = x.event_id where x.id = p
$$;
grant execute on function public.ig_slide(bigint) to anon, authenticated;
-- Reel videos are stored next to the images (Instagram fetches them from here)
update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4'], file_size_limit = 20971520 where id = 'images';
