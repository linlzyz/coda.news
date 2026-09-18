-- More Chinese-language sources. Publisher feeds where they exist; otherwise AnyFeeder (plink.anyfeeder.com), a public RSS bridge.
-- Foreign media's Chinese editions are not added: their country perspective already comes from their home-language feeds.
insert into public.sources (name, country, language, type, rss_url, homepage, reliability, active, priority) values
  ('极客公园',            'CN', 'zh', 'media', 'https://www.geekpark.net/rss',      'https://www.geekpark.net',   75, true, 1),
  ('爱范儿',              'CN', 'zh', 'media', 'https://www.ifanr.com/feed',        'https://www.ifanr.com',      75, true, 1),
  ('雷峰网',              'CN', 'zh', 'media', 'https://www.leiphone.com/feed',     'https://www.leiphone.com',   75, true, 1),
  ('虎嗅',                'CN', 'zh', 'media', 'https://plink.anyfeeder.com/huxiu',                          'https://www.huxiu.com',      75, true, 1),
  ('财富中文网 商业',     'CN', 'zh', 'media', 'https://plink.anyfeeder.com/fortunechina/shangye',           'https://www.fortunechina.com', 80, true, 1),
  ('经济日报',            'CN', 'zh', 'media', 'https://plink.anyfeeder.com/jingjiribao',                    'http://paper.ce.cn',         80, true, 1),
  ('界面新闻 商业',       'CN', 'zh', 'media', 'https://plink.anyfeeder.com/jiemian/business',               'https://www.jiemian.com',    75, true, 1),
  ('界面新闻 财经',       'CN', 'zh', 'media', 'https://plink.anyfeeder.com/jiemian/finance',                'https://www.jiemian.com',    75, true, 1),
  ('21世纪经济报道',      'CN', 'zh', 'media', 'https://plink.anyfeeder.com/weixin/jjbd21',                  'https://www.21jingji.com',   80, true, 1),
  ('财新',                'CN', 'zh', 'media', 'https://plink.anyfeeder.com/weixin/caixinwang',              'https://www.caixin.com',     85, true, 1),
  ('央视财经',            'CN', 'zh', 'media', 'https://plink.anyfeeder.com/weixin/cctvyscj',                'https://news.cctv.com',      80, true, 1),
  ('华尔街见闻',          'CN', 'zh', 'media', 'https://plink.anyfeeder.com/weixin/wallstreetcn',            'https://wallstreetcn.com',   70, true, 1),
  ('新华社',              'CN', 'zh', 'media', 'https://plink.anyfeeder.com/newscn/whxw',                    'http://www.news.cn',         85, true, 2),
  ('人民网',              'CN', 'zh', 'media', 'https://plink.anyfeeder.com/people',                         'http://www.people.com.cn',   85, true, 2),
  ('澎湃新闻',            'CN', 'zh', 'media', 'https://plink.anyfeeder.com/thepaper',                       'https://www.thepaper.cn',    80, true, 2),
  ('新浪体育',            'CN', 'zh', 'media', 'https://plink.anyfeeder.com/weixin/sports_sina',             'https://sports.sina.com.cn', 70, true, 2)
on conflict (rss_url) do nothing;
-- the direct 钛媒体 feed times out from our servers; read it through the bridge instead
update public.sources set rss_url = 'https://plink.anyfeeder.com/tmtpost' where name = '钛媒体' and rss_url not like '%anyfeeder%';
