alter table public.events drop constraint if exists events_category_check;
alter table public.events add constraint events_category_check check (category in ('technology','economy','sport','entertainment','fashion','travel','automotive','gaming'));
insert into public.sources (name, country, language, type, rss_url, homepage, reliability, active, priority) values
  ('Carscoops',          'US', 'en', 'media', 'https://www.carscoops.com/feed/',            'https://www.carscoops.com',   65, true, 2),
  ('Motor1',             'US', 'en', 'media', 'https://www.motor1.com/rss/news/all/',       'https://www.motor1.com',      70, true, 2),
  ('InsideEVs',          'US', 'en', 'media', 'https://insideevs.com/rss/news/all/',        'https://insideevs.com',       70, true, 2),
  ('CarExpert',          'AU', 'en', 'media', 'https://www.carexpert.com.au/feed',          'https://www.carexpert.com.au', 70, true, 2),
  ('CnEVPost',           'CN', 'en', 'media', 'https://cnevpost.com/feed/',                 'https://cnevpost.com',        70, true, 2),
  ('Le Monde Automobile','FR', 'fr', 'media', 'https://www.lemonde.fr/automobile/rss_full.xml', 'https://www.lemonde.fr/automobile', 80, true, 2),
  ('IGN',                'US', 'en', 'media', 'https://feeds.feedburner.com/ign/news',      'https://www.ign.com',         70, true, 2),
  ('GameSpot',           'US', 'en', 'media', 'https://www.gamespot.com/feeds/news/',       'https://www.gamespot.com',    70, true, 2),
  ('Kotaku',             'US', 'en', 'media', 'https://kotaku.com/rss',                     'https://kotaku.com',          65, true, 2),
  ('Eurogamer',          'GB', 'en', 'media', 'https://www.eurogamer.net/feed',             'https://www.eurogamer.net',   70, true, 2),
  ('GamesIndustry.biz',  'GB', 'en', 'media', 'https://www.gamesindustry.biz/feed',         'https://www.gamesindustry.biz', 75, true, 2),
  ('4Gamer',             'JP', 'ja', 'media', 'https://www.4gamer.net/rss/index.xml',       'https://www.4gamer.net',      70, true, 2),
  ('Gamekult',           'FR', 'fr', 'media', 'https://www.gamekult.com/feed.xml',          'https://www.gamekult.com',    65, true, 2)
on conflict (rss_url) do nothing;
