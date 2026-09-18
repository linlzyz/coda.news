-- Where to anchor the crop: 'top' for portraits so faces are not cut off in wide banners.
alter table public.events add column if not exists image_focus text;
update public.events set image_focus = 'top' where image_person is not null and person_checked_at is not null and image_source = 'commons';
