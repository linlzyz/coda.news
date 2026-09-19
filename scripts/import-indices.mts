// Tags companies with S&P 100 / Nasdaq-100 membership (scripts/indices.json), adding any we do not have yet.
import postgres from "postgres"; import {readFileSync} from "fs";
const env=Object.fromEntries(readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0],l.slice(l.indexOf("=")+1)]));
const sql=postgres(env.DATABASE_URL,{max:1});
const slugify=(n:string)=>n.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const lists: Record<string,{name:string;qid:string;wiki:string}[]> = JSON.parse(readFileSync("scripts/indices.json","utf8"));
(async()=>{
  for (const [key, arr] of Object.entries(lists)) {
    const rows = arr.map((x) => ({ ...x, slug: slugify(x.name), url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(x.wiki.replace(/ /g, "_")) }));
    await sql`update companies set indices = array_remove(indices, ${key})`;
    const t = await sql`update companies c set indices = array(select distinct unnest(c.indices || array[${key}]::text[]))
      from jsonb_to_recordset(${sql.json(rows as any)}) x(name text, qid text) where c.wikidata_id = x.qid or lower(c.name) = lower(x.name)`;
    const a = await sql`insert into companies (name, slug, wikidata_id, wikipedia_en, indices, kind)
      select distinct on (x.qid) x.name, case when exists (select 1 from companies c where c.slug = x.slug) then x.slug || '-' || substr(md5(x.qid), 1, 4) else x.slug end, x.qid, x.url, array[${key}]::text[], 'company'
      from jsonb_to_recordset(${sql.json(rows as any)}) x(name text, qid text, slug text, url text)
      where not exists (select 1 from companies c where c.wikidata_id = x.qid or lower(c.name) = lower(x.name))
      on conflict do nothing`;
    console.log(key, { tagged: t.count, added: a.count }, (await sql`select count(*) from companies where ${key} = any(indices)`)[0]);
  }
  await sql.end();
})();
