import { readFileSync } from "fs";
const { parseFeed, UA } = await import("../supabase/functions/_shared/text.ts");
const list = JSON.parse(readFileSync(process.argv[2], "utf8"));
const res = await Promise.all(list.map(async ([g, name, url]: string[]) => {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
    const items = r.ok ? parseFeed(await r.text()) : [];
    const recent = items.filter((i) => i.published && Date.now() - +i.published < 72 * 3600_000).length;
    return `${items.length && recent ? "OK" : "--"} ${g.padEnd(5)} ${String(r.status).padEnd(4)} ${String(items.length).padStart(3)} recent72h=${String(recent).padStart(3)} ${name}`;
  } catch (e) { return `-- ${g.padEnd(5)} ERR  ${name} ${(e as Error).message.slice(0, 40)}`; }
}));
console.log(res.join("\n"));
