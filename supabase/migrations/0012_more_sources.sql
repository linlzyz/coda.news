-- More entertainment and fashion sources, chosen for country spread (the site compares coverage across countries).
insert into public.sources (name, country, language, type, rss_url, homepage, reliability, active, priority) values
  ('Billboard',            'US', 'en', 'media', 'https://www.billboard.com/feed/',          'https://www.billboard.com',   75, true, 2),
  ('NME',                  'GB', 'en', 'media', 'https://www.nme.com/feed',                 'https://www.nme.com',         70, true, 2),
  ('Vogue UK',             'GB', 'en', 'media', 'https://www.vogue.co.uk/feed/rss',         'https://www.vogue.co.uk',     75, true, 2),
  ('Vogue France',         'FR', 'fr', 'media', 'https://www.vogue.fr/feed/rss',            'https://www.vogue.fr',        75, true, 2),
  ('Vogue Germany',        'DE', 'de', 'media', 'https://www.vogue.de/feed/rss',            'https://www.vogue.de',        75, true, 2),
  ('Vogue Italia',         'IT', 'it', 'media', 'https://www.vogue.it/feed/rss',            'https://www.vogue.it',        75, true, 2),
  ('Vogue España',         'ES', 'es', 'media', 'https://www.vogue.es/feed/rss',            'https://www.vogue.es',        75, true, 2),
  ('Vogue Japan',          'JP', 'ja', 'media', 'https://www.vogue.co.jp/feed/rss',         'https://www.vogue.co.jp',     75, true, 2),
  ('Vogue Korea',          'KR', 'ko', 'media', 'https://www.vogue.co.kr/feed/',            'https://www.vogue.co.kr',     75, true, 2),
  ('Vogue India',          'IN', 'en', 'media', 'https://www.vogue.in/feed/rss',            'https://www.vogue.in',        75, true, 2),
  ('FashionUnited UK',     'GB', 'en', 'media', 'https://fashionunited.uk/rss-news',        'https://fashionunited.uk',    75, true, 2),
  ('FashionUnited India',  'IN', 'en', 'media', 'https://fashionunited.in/rss-news',        'https://fashionunited.in',    75, true, 2),
  ('Marie Claire Australia','AU','en', 'media', 'https://www.marieclaire.com.au/feed',      'https://www.marieclaire.com.au', 70, true, 2),
  ('Dazed',                'GB', 'en', 'media', 'https://www.dazeddigital.com/rss',         'https://www.dazeddigital.com', 70, true, 2)
on conflict (rss_url) do nothing;
