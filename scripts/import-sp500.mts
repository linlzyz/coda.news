// Adds the S&P 500 companies (from scripts/sp500.json) to the companies table in one go; enrichment fills in the rest.
import postgres from "postgres"; import {readFileSync} from "fs";
const env=Object.fromEntries(readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0],l.slice(l.indexOf("=")+1)]));
const sql=postgres(env.DATABASE_URL,{max:1});
const slugify=(n:string)=>n.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const sp=(JSON.parse(readFileSync("scripts/sp500.json","utf8")) as {sym:string;name:string;qid:string;wiki:string}[])
  .map((x)=>({ ...x, slug: slugify(x.name), url: "https://en.wikipedia.org/wiki/"+encodeURIComponent(x.wiki.replace(/ /g,"_")) }));
(async()=>{

  // tag the ones we already have (same Wikidata entity or same name)
  const t = await sql`update companies c set indices = array(select distinct unnest(c.indices || '{SP500}'::text[]))
    from jsonb_to_recordset(${sql.json(sp as any)}) x(name text, qid text) where c.wikidata_id = x.qid or lower(c.name) = lower(x.name)`;
  // add the rest (slug gets the ticker if taken)
  const a = await sql`insert into companies (name, slug, wikidata_id, wikipedia_en, indices, kind)
    select x.name, case when exists (select 1 from companies c where c.slug = x.slug) then x.slug || '-' || lower(x.sym) else x.slug end, x.qid, x.url, '{SP500}', 'company'
    from jsonb_to_recordset(${sql.json(sp as any)}) x(name text, qid text, slug text, sym text, url text)
    where not exists (select 1 from companies c where c.wikidata_id = x.qid or lower(c.name) = lower(x.name))
    on conflict do nothing`;
  console.log({ tagged: t.count, added: a.count }, await sql`select count(*) from companies where 'SP500' = any(indices)`);
  await sql.end();
})();
