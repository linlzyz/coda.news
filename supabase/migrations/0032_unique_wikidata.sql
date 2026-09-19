-- one company per Wikidata entity: stops the same brand appearing twice in the directory
create unique index if not exists companies_wikidata_uniq on public.companies (wikidata_id) where wikidata_id is not null;
