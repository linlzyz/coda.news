-- Duplicate companies (same Wikidata entity under two names) are merged into one; old URLs redirect.
create table if not exists public.company_redirects (slug text primary key, company_id bigint not null references public.companies(id) on delete cascade);
alter table public.company_redirects enable row level security;
drop policy if exists "read redirects" on public.company_redirects;
create policy "read redirects" on public.company_redirects for select using (true);
grant select on public.company_redirects to anon, authenticated;

create or replace function public.merge_companies(keep bigint, lose bigint) returns void language plpgsql as $$
declare l public.companies;
begin
  if keep = lose then return; end if;
  select * into l from public.companies where id = lose;
  if not found then return; end if;
  update public.events set company_ids = array(select distinct unnest(array_replace(company_ids, lose, keep))) where lose = any(company_ids);
  update public.follows set company_id = keep where company_id = lose
    and not exists (select 1 from public.follows f2 where f2.company_id = keep and f2.email = follows.email);
  update public.company_redirects set company_id = keep where company_id = lose;
  insert into public.company_redirects (slug, company_id) values (l.slug, keep) on conflict (slug) do update set company_id = keep;
  update public.companies k set
    aliases = array(select distinct x from unnest(coalesce(k.aliases, '{}') || coalesce(l.aliases, '{}') || array[l.name]) x where lower(x) <> lower(k.name)),
    website = coalesce(k.website, l.website), logo_url = coalesce(k.logo_url, l.logo_url), description = coalesce(k.description, l.description)
  where k.id = keep;
  delete from public.companies where id = lose;
end $$;
