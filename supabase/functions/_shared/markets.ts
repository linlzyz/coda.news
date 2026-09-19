// Daily closes of major stock indices from FRED (Federal Reserve Bank of St. Louis). Refreshed every 3 hours at most.
import { db } from "./db.ts";
import { env, log } from "./env.ts";

// [display name, FRED id, group]
const SERIES: [string, string, string][] = [
  ["S&P 500", "SP500", "indices"], ["NASDAQ", "NASDAQCOM", "indices"], ["NASDAQ 100", "NASDAQ100", "indices"],
  ["DOW JONES", "DJIA", "indices"], ["NIKKEI 225", "NIKKEI225", "indices"], ["VIX", "VIXCLS", "indices"],
  ["US 10Y %", "DGS10", "rates"], ["US 2Y %", "DGS2", "rates"], ["WTI OIL", "DCOILWTICO", "rates"],
  ["BRENT OIL", "DCOILBRENTEU", "rates"], ["NAT GAS", "DHHNGSP", "rates"],
];

export async function refreshIndices(force = false): Promise<number> {
  const key = env("FRED_API_KEY"); if (!key) return 0;
  const sql = db();
  if (!force) {
    const [r] = await sql`select min(updated_at) as t from market_series`;
    const [c] = await sql`select count(*)::int as n from market_series`;
    if (c.n < SERIES.length) r.t = null;
    if (r?.t && Date.now() - new Date(r.t).getTime() < 3 * 3600_000) return 0;
  }
  const start = new Date(Date.now() - 45 * 86400_000).toISOString().slice(0, 10);
  let n = 0;
  for (const [i, [name, id, grp]] of SERIES.entries()) {
    try {
      const r = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&observation_start=${start}`, { signal: AbortSignal.timeout(10000) });
      const j = await r.json();
      const obs = (j.observations ?? []).filter((o: { value: string }) => o.value !== ".").map((o: { date: string; value: string }) => ({ d: o.date, v: +o.value }));
      if (obs.length < 2) continue;
      const last = obs[obs.length - 1], prev = obs[obs.length - 2];
      await sql`insert into market_series (name, grp, sort, value, change, series, digits, as_of, updated_at)
                values (${name}, ${grp}, ${i}, ${last.v}, ${((last.v - prev.v) / prev.v) * 100}, ${sql.json(obs.slice(-30).map((o: { v: number }) => o.v))}, 2, ${last.d}, now())
                on conflict (name) do update set value = excluded.value, change = excluded.change, series = excluded.series, as_of = excluded.as_of, updated_at = now(), sort = excluded.sort, grp = excluded.grp`;
      n++;
    } catch (e) { log(`fred ${id}:`, (e as Error).message); }
  }
  n += await chinaIndices().catch((e) => { log("cn markets:", (e as Error).message); return 0; });
  log(`markets: ${n} series`);
  return n;
}

// Mainland A and B shares (Sina daily candles) and Hong Kong (Sina quotes; the daily history builds up in our table)
const CN: [string, string][] = [["SHANGHAI", "sh000001"], ["SHENZHEN", "sz399001"], ["CSI 300", "sh000300"], ["SSE B-SHARE", "sh000003"], ["SZSE B-SHARE", "sz399108"]];
const HK: [string, string][] = [["HANG SENG", "rt_hkHSI"], ["HS TECH", "rt_hkHSTECH"]];
async function chinaIndices(): Promise<number> {
  const sql = db(); let n = 0;
  const ua = { "user-agent": "Mozilla/5.0", referer: "https://finance.sina.com.cn" };
  for (const [i, [name, sym]] of CN.entries()) {
    try {
      const k = await (await fetch(`https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${sym}&scale=240&ma=no&datalen=30`, { headers: ua, signal: AbortSignal.timeout(10000) })).json() as { day: string; close: string }[];
      if (!Array.isArray(k) || k.length < 2) continue;
      const v = k.map((x) => +x.close), last = v[v.length - 1], prev = v[v.length - 2];
      await sql`insert into market_series (name, grp, sort, value, change, series, digits, as_of, updated_at)
                values (${name}, 'cn', ${i}, ${last}, ${((last - prev) / prev) * 100}, ${sql.json(v)}, 2, ${k[k.length - 1].day}, now())
                on conflict (name) do update set value = excluded.value, change = excluded.change, series = excluded.series, as_of = excluded.as_of, updated_at = now(), sort = excluded.sort, grp = excluded.grp`;
      n++;
    } catch (e) { log(`sina ${sym}:`, (e as Error).message); }
  }
  try {
    const txt = new TextDecoder("gbk").decode(await (await fetch(`https://hq.sinajs.cn/list=${HK.map((h) => h[1]).join(",")}`, { headers: ua, signal: AbortSignal.timeout(10000) })).arrayBuffer());
    for (const [i, [name, sym]] of HK.entries()) {
      const f = txt.match(new RegExp(`hq_str_${sym}="([^"]*)"`))?.[1]?.split(",");
      if (!f || f.length < 18) continue;
      const last = +f[6], prevClose = +f[3], day = f[17].replace(/\//g, "-");
      if (!last || !prevClose) continue;
      const [old] = await sql<{ series: number[]; as_of: string }[]>`select series, as_of::text from market_series where name = ${name}`;
      let series = old?.series?.length ? [...old.series] : [prevClose];
      if (old?.as_of?.slice(0, 10) === day) series[series.length - 1] = last; else series.push(last);
      series = series.slice(-30);
      await sql`insert into market_series (name, grp, sort, value, change, series, digits, as_of, updated_at)
                values (${name}, 'cn', ${CN.length + i}, ${last}, ${((last - prevClose) / prevClose) * 100}, ${sql.json(series)}, 2, ${day}, now())
                on conflict (name) do update set value = excluded.value, change = excluded.change, series = excluded.series, as_of = excluded.as_of, updated_at = now(), sort = excluded.sort, grp = excluded.grp`;
      n++;
    }
  } catch (e) { log("sina hk:", (e as Error).message); }
  return n;
}
