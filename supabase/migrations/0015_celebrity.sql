-- Celebrity news in Entertainment: a topic and more sources across the US, UK and India.
insert into public.topics (name, slug, color) values ('Celebrity', 'celebrity', '#E11D48') on conflict (slug) do nothing;
insert into public.sources (name, country, language, type, rss_url, homepage, reliability, active, priority) values
  ('People',           'US', 'en', 'media', 'https://feeds-api.dotdashmeredith.com/v1/rss/google/6bb3396f-8157-4dc5-8fcf-c1bd9d415be8', 'https://people.com', 70, true, 2),
  ('People Celebrity', 'US', 'en', 'media', 'https://feeds-api.dotdashmeredith.com/v1/rss/google/79365970-e87d-4fb6-966a-1c657b08f44f', 'https://people.com', 70, true, 2),
  ('E! News',          'US', 'en', 'media', 'https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml', 'https://www.eonline.com', 65, true, 2),
  ('Us Weekly',        'US', 'en', 'media', 'https://www.usmagazine.com/feed/', 'https://www.usmagazine.com', 60, true, 2),
  ('Page Six',         'US', 'en', 'media', 'https://pagesix.com/feed/', 'https://pagesix.com', 55, true, 2),
  ('TMZ',              'US', 'en', 'media', 'https://www.tmz.com/rss.xml', 'https://www.tmz.com', 55, true, 2),
  ('Just Jared',       'US', 'en', 'media', 'https://www.justjared.com/feed/', 'https://www.justjared.com', 55, true, 2),
  ('The Sun Showbiz',  'GB', 'en', 'media', 'https://www.thesun.co.uk/tvandshowbiz/feed/', 'https://www.thesun.co.uk', 50, true, 2),
  ('Mirror 3AM',       'GB', 'en', 'media', 'https://www.mirror.co.uk/3am/?service=rss', 'https://www.mirror.co.uk', 55, true, 2),
  ('Bollywood Hungama','IN', 'en', 'media', 'https://www.bollywoodhungama.com/rss/news.xml', 'https://www.bollywoodhungama.com', 60, true, 2)
on conflict (rss_url) do nothing;
