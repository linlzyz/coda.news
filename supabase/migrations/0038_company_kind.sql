-- companies table holds only companies and brands; people, products, places and the like are classified out
alter table public.companies add column if not exists kind_checked_at timestamptz;
