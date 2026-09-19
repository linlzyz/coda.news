-- what a "company" row really is (company vs league/regulator/etc.), and index memberships such as the S&P 500
alter table public.companies add column if not exists kind text not null default 'company', add column if not exists indices text[] not null default '{}';
update public.companies set kind = 'org'
where description ~* '\m(league|federation|association|confederation|central bank|regulator|regulatory|agency|ministry|department|government|university|college|union|council|committee|olympic|court|parliament|police|army|navy|tournament|championship|competition)\M';
