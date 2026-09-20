-- Instagram: travel posts rotate in every few days, with their own photo and copy (kept on the post, not the event)
alter table public.ig_posts add column if not exists kind text not null default 'news', add column if not exists img_url text,
  add column if not exists img_credit text, add column if not exists copy jsonb;
-- the slide renderer reads only these display fields for one post
create or replace function public.ig_slide(p bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('img', img_url, 'credit', img_credit, 'copy', copy) from ig_posts where id = p and kind = 'travel'
$$;
grant execute on function public.ig_slide(bigint) to anon, authenticated;
