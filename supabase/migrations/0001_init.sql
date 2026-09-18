-- Coda.news V1 schema
-- Facts are stored. Narratives are generated.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- 1. sources
create table if not exists public.sources (
  id            bigserial primary key,
  name          text not null,
  country       text not null,               -- ISO 3166 alpha-2, e.g. US, CN
  language      text not null,               -- ISO 639-1, e.g. en, zh
  type          text not null default 'media' check (type in ('official','wire','media')),
  rss_url       text not null unique,
  homepage      text,
  reliability   smallint not null default 70 check (reliability between 0 and 100),
  active        boolean not null default true,
  last_fetched_at timestamptz,
  last_status   text,
  fail_count    int not null default 0,
  created_at    timestamptz not null default now()
);

-- 2. companies
create table if not exists public.companies (
  id          bigserial primary key,
  name        text not null unique,
  slug        text not null unique,
  aliases     text[] not null default '{}',
  website     text,
  description text,
  created_at  timestamptz not null default now()
);
create index if not exists companies_aliases_idx on public.companies using gin (aliases);

-- 3. topics
create table if not exists public.topics (
  id    serial primary key,
  name  text not null unique,
  slug  text not null unique,
  color text
);

-- 4. events
create table if not exists public.events (
  id                   bigserial primary key,
  slug                 text not null unique,
  title                text not null,
  title_zh             text,
  category             text not null default 'technology' check (category in ('technology','economy')),
  status               text not null default 'developing'
                         check (status in ('rumor','breaking','developing','confirmed','resolved','archived')),
  confidence           smallint not null default 0,
  importance           smallint not null default 0,
  summary              text,
  summary_zh           text,
  summary_version      int not null default 0,
  summary_generated_at timestamptz,
  needs_regen          boolean not null default true,
  embedding            extensions.vector(768),
  company_ids          bigint[] not null default '{}',
  topic_ids            int[] not null default '{}',
  countries            text[] not null default '{}',
  source_count         int not null default 0,
  article_count        int not null default 0,
  has_official         boolean not null default false,
  image_url            text,
  image_credit         text,
  started_at           timestamptz not null default now(),
  last_article_at      timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists events_last_article_idx on public.events (last_article_at desc);
create index if not exists events_importance_idx on public.events (importance desc);
create index if not exists events_embedding_idx on public.events using hnsw (embedding extensions.vector_cosine_ops);

-- 5. articles (temporary input; full_text purged after 24h)
create table if not exists public.articles (
  id            bigserial primary key,
  source_id     bigint not null references public.sources(id) on delete cascade,
  url           text not null unique,
  title         text not null,
  rss_summary   text,
  image_url     text,
  full_text     text,
  published_at  timestamptz,
  fetched_at    timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending','processing','done','skipped','failed')),
  attempts      int not null default 0,
  error         text,
  embedding     extensions.vector(768),
  event_id      bigint references public.events(id) on delete set null,
  headline_en   text,
  created_at    timestamptz not null default now()
);
create index if not exists articles_status_idx on public.articles (status, fetched_at);
create index if not exists articles_event_idx on public.articles (event_id);

-- 6. event_updates (timeline + facts + history)
create table if not exists public.event_updates (
  id          bigserial primary key,
  event_id    bigint not null references public.events(id) on delete cascade,
  type        text not null check (type in ('fact','timeline','summary_updated','perspective_changed','status_changed','importance_changed')),
  content     jsonb not null,
  source_ids  bigint[] not null default '{}',
  article_ids bigint[] not null default '{}',
  occurred_at timestamptz not null default now(),
  version     int not null default 1,
  created_at  timestamptz not null default now()
);
create index if not exists event_updates_event_idx on public.event_updates (event_id, occurred_at desc);

-- 7. perspectives
create table if not exists public.perspectives (
  id            bigserial primary key,
  event_id      bigint not null references public.events(id) on delete cascade,
  country       text not null,
  headline      text,         -- typical headline, translated to English
  framing       text,         -- short label, e.g. "Opportunity"
  emphasis      text,
  downplayed    text,
  tone          text check (tone in ('positive','neutral','negative')),
  article_count int not null default 0,
  updated_at    timestamptz not null default now(),
  unique (event_id, country)
);

-- vector search: candidate events for a new article
create or replace function public.match_events(query extensions.vector(768), since timestamptz, k int default 5)
returns table (id bigint, title text, similarity float)
language sql stable
set search_path = public, extensions
as $$
  select e.id, e.title, 1 - (e.embedding <=> query) as similarity
  from public.events e
  where e.embedding is not null and e.last_article_at > since
  order by e.embedding <=> query
  limit k;
$$;

-- security: RLS on, public (anon) may only read published knowledge, never raw articles' text
alter table public.sources        enable row level security;
alter table public.companies      enable row level security;
alter table public.topics         enable row level security;
alter table public.events         enable row level security;
alter table public.articles       enable row level security;
alter table public.event_updates  enable row level security;
alter table public.perspectives   enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on function public.match_events to service_role;

do $$
declare t text;
begin
  foreach t in array array['sources','companies','topics','events','event_updates','perspectives'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- articles: public may read link metadata only (no full_text)
grant select (id, source_id, url, title, image_url, published_at, event_id, headline_en) on public.articles to anon, authenticated;
drop policy if exists "public read" on public.articles;
create policy "public read" on public.articles for select to anon, authenticated using (status = 'done');
