insert into public.topics (name, slug, color) values
 ('Artificial Intelligence','artificial-intelligence','#6D4AFF'),
 ('Semiconductors','semiconductors','#0E8C8C'),
 ('Big Tech','big-tech','#2447D6'),
 ('Economy','economy','#B7791F'),
 ('Markets','markets','#1F8A4C'),
 ('Trade','trade','#C2410C'),
 ('Electric Vehicles','electric-vehicles','#0F766E'),
 ('Energy','energy','#A16207'),
 ('Startups','startups','#DB2777'),
 ('Crypto','crypto','#7C3AED')
on conflict (slug) do nothing;
