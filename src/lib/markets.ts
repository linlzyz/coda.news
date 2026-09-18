import "server-only";

export interface Quote { name: string; value: number; change: number; series: number[]; digits: number }

async function j(url: string) {
  const r = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/** Crypto from CoinGecko (free, no key). */
export async function crypto(): Promise<Quote[]> {
  const coins: [string, string][] = [["bitcoin", "BTC"], ["ethereum", "ETH"], ["solana", "SOL"]];
  const out = await Promise.all(coins.map(async ([id, name]) => {
    try {
      const d = await j(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`);
      const series = (d.prices as [number, number][]).filter((_, i, a) => i % Math.ceil(a.length / 40) === 0).map((p) => p[1]);
      const last = series[series.length - 1], first = series[0];
      return { name, value: last, change: ((last - first) / first) * 100, series, digits: last > 1000 ? 0 : 2 };
    } catch { return null; }
  }));
  return out.filter(Boolean) as Quote[];
}

/** FX from the European Central Bank reference rates via Frankfurter (free, no key). */
export async function fx(): Promise<Quote[]> {
  try {
    const start = new Date(Date.now() - 35 * 86400_000).toISOString().slice(0, 10);
    const d = await j(`https://api.frankfurter.dev/v1/${start}..?base=USD&symbols=CNY,JPY,EUR,AUD,GBP`);
    const days = Object.keys(d.rates).sort();
    const pairs: [string, string, boolean][] = [["USD/CNY", "CNY", false], ["USD/JPY", "JPY", false], ["EUR/USD", "EUR", true], ["AUD/USD", "AUD", true], ["GBP/USD", "GBP", true]];
    return pairs.map(([name, sym, inv]) => {
      const series = days.map((k) => (inv ? 1 / d.rates[k][sym] : d.rates[k][sym]));
      const last = series[series.length - 1], prev = series[series.length - 2] ?? last;
      return { name, value: last, change: ((last - prev) / prev) * 100, series, digits: sym === "JPY" ? 2 : 4 };
    });
  } catch { return []; }
}
