-- Structured licence record for every event photo, and no more publisher (RSS) images.
alter table public.events
  add column if not exists image_source      text,          -- unsplash | pexels | pixabay | commons | openverse
  add column if not exists image_license     text,          -- e.g. "Pexels License", "CC BY 4.0"
  add column if not exists image_license_url text,
  add column if not exists image_fetched_at  timestamptz,
  add column if not exists image_changes     text not null default 'cropped to fit layout; no text or colour changes on the site';

-- backfill from the existing credit line
update public.events set
  image_source = case when image_credit like '%/ Unsplash' then 'unsplash' when image_credit like '%/ Pexels' then 'pexels'
                      when image_credit like '%/ Pixabay' then 'pixabay' when image_credit like '%Wikimedia Commons%' then 'commons' end,
  image_license = case when image_credit like '%/ Unsplash' then 'Unsplash License' when image_credit like '%/ Pexels' then 'Pexels License'
                       when image_credit like '%/ Pixabay' then 'Pixabay Content License'
                       when image_credit like '%Wikimedia Commons%' then substring(image_credit from '\(([^()]+)\)$') end,
  image_license_url = case when image_credit like '%/ Unsplash' then 'https://unsplash.com/license' when image_credit like '%/ Pexels' then 'https://www.pexels.com/license/'
                           when image_credit like '%/ Pixabay' then 'https://pixabay.com/service/license-summary/' end,
  image_fetched_at = coalesce(image_checked_at, now())
where image_url is not null and image_source is null;

-- drop publisher images: clear them on articles and events, then let the image step find an open-licence photo
update public.articles set image_url = null where image_url is not null;
update public.events set image_url = null, image_credit = null, image_link = null, image_checked_at = null, image_fetched_at = null
where image_url is not null and image_credit is null;

-- refresh_event must no longer copy publisher images (kept as a no-op source: articles.image_url is always null now)
