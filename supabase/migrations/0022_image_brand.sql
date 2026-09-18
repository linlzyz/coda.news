-- The one brand a story is mainly about (if any): its logo is used only then, never just because a company is mentioned.
alter table public.events add column if not exists image_brand text;
-- local-only Indian entertainment and sport feeds: single-country stories with little to compare
update public.sources set active = false where name in ('Bollywood Hungama', 'The Hindu Entertainment', 'The Hindu Sport');
