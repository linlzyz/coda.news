-- Travel section: topics and sources (priority 2, like the other non-business sections).
insert into public.topics (name, slug, color) values ('Aviation', 'aviation', '#0369A1'), ('Tourism', 'tourism', '#0891B2') on conflict (slug) do nothing;
insert into public.sources (name, country, language, type, rss_url, homepage, reliability, active, priority) values
  ('Skift',                  'US', 'en', 'media', 'https://skift.com/feed/',                         'https://skift.com',                75, true, 2),
  ('Simple Flying',          'US', 'en', 'media', 'https://simpleflying.com/feed/',                  'https://simpleflying.com',         65, true, 2),
  ('Condé Nast Traveler',    'US', 'en', 'media', 'https://www.cntraveler.com/feed/rss',             'https://www.cntraveler.com',       70, true, 2),
  ('The New York Times Travel','US','en', 'media', 'https://www.nytimes.com/services/xml/rss/nyt/Travel.xml', 'https://www.nytimes.com/section/travel', 80, true, 2),
  ('The Guardian Travel',    'GB', 'en', 'media', 'https://www.theguardian.com/travel/rss',          'https://www.theguardian.com/travel', 80, true, 2),
  ('Travel Weekly Australia','AU', 'en', 'media', 'https://www.travelweekly.com.au/feed/',           'https://www.travelweekly.com.au',  70, true, 2),
  ('TTG Asia',               'SG', 'en', 'media', 'https://www.ttgasia.com/feed/',                   'https://www.ttgasia.com',          70, true, 2),
  ('Le Monde Voyage',        'FR', 'fr', 'media', 'https://www.lemonde.fr/voyage/rss_full.xml',      'https://www.lemonde.fr/voyage',    80, true, 2),
  ('Der Spiegel Reise',      'DE', 'de', 'media', 'https://www.spiegel.de/reise/index.rss',          'https://www.spiegel.de/reise',     80, true, 2)
on conflict (rss_url) do nothing;
-- Thomas the Tank Engine voice story: a steam train, not a TV remote
update public.events set image_url = null, image_credit = null, image_link = null, image_source = null, image_checked_at = null, brand_checked_at = now(),
  image_query = 'vintage steam locomotive' where id = 1256;
alter table public.events drop constraint if exists events_category_check;
alter table public.events add constraint events_category_check check (category in ('technology','economy','sport','entertainment','fashion','travel'));
