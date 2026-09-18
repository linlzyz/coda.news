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
  log(`markets: ${n} series`);
  return n;
}
