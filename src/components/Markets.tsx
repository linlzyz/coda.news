"use client";
import { useState } from "react";
import type { Quote } from "@/lib/markets";
import { AU, US, CN, EU, JP, GB, KR, HK, SG, IN, CA } from "country-flag-icons/react/3x2";
const CRYPTO = new Set(["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"]);

const FLAGS: Record<string, typeof AU> = { AU, US, CN, EU, JP, GB, KR, HK, SG, IN, CA };
const CUR: Record<string, string> = { AUD: "AU", USD: "US", CNY: "CN", EUR: "EU", JPY: "JP", GBP: "GB", KRW: "KR", HKD: "HK", SGD: "SG", INR: "IN", CAD: "CA" };
// what each index or rate is, in one line
const INFO: Record<string, { c?: string; en: string; zh: string }> = {
  "S&P 500": { c: "US", en: "The 500 largest US listed companies; the main gauge of the US market.", zh: "美国 500 家最大上市公司，是衡量美股整体表现的主要指标。" },
  "NASDAQ": { c: "US", en: "Every stock on the Nasdaq exchange, heavy in tech.", zh: "纳斯达克交易所全部股票，科技公司占比很高。" },
  "NASDAQ 100": { c: "US", en: "The 100 largest non-financial Nasdaq companies: Apple, Microsoft, NVIDIA and the like.", zh: "纳斯达克最大的 100 家非金融公司，比如苹果、微软、英伟达。" },
  "DOW JONES": { c: "US", en: "30 blue-chip US companies; the oldest US index.", zh: "道琼斯指数，30 家美国蓝筹公司，历史最悠久的美股指数。" },
  "NIKKEI 225": { c: "JP", en: "225 leading companies on the Tokyo Stock Exchange.", zh: "日经 225，东京证券交易所 225 家代表性公司。" },
  "VIX": { c: "US", en: "The \"fear index\": expected US market swings over the next 30 days. Higher means more nervous.", zh: "恐慌指数，反映市场对未来 30 天美股波动的预期，越高越紧张。" },
  "US 10Y %": { c: "US", en: "Yield on 10-year US government bonds; drives mortgage and borrowing costs worldwide.", zh: "美国 10 年期国债收益率，影响全球房贷和借贷成本。" },
  "US 2Y %": { c: "US", en: "Yield on 2-year US government bonds; follows expectations for Fed rates.", zh: "美国 2 年期国债收益率，跟随市场对美联储利率的预期。" },
  "SHANGHAI": { c: "CN", en: "Shanghai Composite: every stock on the Shanghai exchange (A and B shares).", zh: "上证指数：上海证券交易所全部股票，A 股大盘的主要指标。" },
  "SHENZHEN": { c: "CN", en: "Shenzhen Component: 500 leading stocks on the Shenzhen exchange, heavy in tech and manufacturing.", zh: "深证成指：深圳证券交易所 500 只代表性股票，科技和制造业占比高。" },
  "CSI 300": { c: "CN", en: "The 300 largest A-shares in Shanghai and Shenzhen; the main benchmark for China's stock market.", zh: "沪深 300：沪深两市最大的 300 只 A 股，衡量中国股市的核心指标。" },
  "SSE B-SHARE": { c: "CN", en: "Shanghai B shares: mainland companies traded in US dollars, open to foreign investors.", zh: "上证 B 股指数：在上海以美元交易的 B 股，外国投资者可以买。" },
  "SZSE B-SHARE": { c: "CN", en: "Shenzhen B shares: mainland companies traded in Hong Kong dollars.", zh: "深证 B 股指数：在深圳以港元交易的 B 股。" },
  "HANG SENG": { c: "HK", en: "The largest companies listed in Hong Kong, including many mainland giants.", zh: "恒生指数：香港上市的大公司，包括很多内地龙头企业。" },
  "HS TECH": { c: "HK", en: "The 30 largest tech companies listed in Hong Kong: Tencent, Alibaba, Meituan, Xiaomi and others.", zh: "恒生科技指数：香港上市的 30 家大型科技公司，如腾讯、阿里、美团、小米。" },
  "WTI OIL": { en: "US crude oil price, US dollars per barrel.", zh: "美国 WTI 原油价格，美元/桶。" },
  "BRENT OIL": { en: "International benchmark crude oil price, US dollars per barrel.", zh: "布伦特原油，国际油价基准，美元/桶。" },
  "NAT GAS": { c: "US", en: "US natural gas price (Henry Hub), US dollars per million BTU.", zh: "美国天然气价格（Henry Hub），美元/百万英热单位。" },
};
// the unit under each name, so a reader knows what the number means
function unitOf(name: string, zh: boolean): string {
  const fx = name.match(/^([A-Z]{3})\/([A-Z]{3})$/);
  if (fx) return zh ? `1 ${fx[1]} 兑 ${fx[2]}` : `${fx[2]} per 1 ${fx[1]}`;
  if (CRYPTO.has(name)) return zh ? "美元" : "USD";
  if (/%$/.test(name)) return zh ? "收益率 %" : "yield %";
  if (/OIL/.test(name)) return zh ? "美元/桶" : "USD per barrel";
  if (name === "NAT GAS") return zh ? "美元/百万英热" : "USD per MMBtu";
  if (name === "VIX") return zh ? "指数" : "index";
  return zh ? "点" : "points";
}
function flagsOf(name: string): string[] {
  if (/^[A-Z]{3}\/[A-Z]{3}$/.test(name)) return name.split("/").map((c) => CUR[c]).filter(Boolean);
  return INFO[name]?.c ? [INFO[name].c!] : [];
}
function Flg({ c }: { c: string }) {
  const F = FLAGS[c]; if (!F) return null;
  return <F style={{ width: 12, height: 8, borderRadius: 1.5, boxShadow: "0 0 0 1px rgba(22,24,29,.12)" }} aria-hidden="true" className="inline-block shrink-0" />;
}

function Spark({ s, up }: { s: number[]; up: boolean }) {
  if (s.length < 2) return <span />;
  const min = Math.min(...s), max = Math.max(...s), r = max - min || 1;
  const pts = s.map((v, i) => `${(i / (s.length - 1)) * 64},${20 - ((v - min) / r) * 18 - 1}`).join(" ");
  return <svg width="100%" height="20" preserveAspectRatio="none" className="block" viewBox="0 0 64 20" aria-hidden="true"><polyline points={pts} fill="none" stroke={up ? "#16A34A" : "#DC2626"} strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
}

export function Markets({ tabs, updated, title, empty, zh = false }: { tabs: { label: string; quotes: Quote[]; note: string }[]; updated: string; title: string; empty: string; zh?: boolean }) {
  const [t, setT] = useState(0);
  const cur = tabs[t];
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-1" role="tablist">
        {tabs.map((x, i) => (
          <button key={x.label} role="tab" aria-selected={i === t} onClick={() => setT(i)}
            className={`min-h-9 rounded-lg px-3 text-[12px] font-medium ${i === t ? "bg-[#F4F5F7] text-[#C2410C]" : "text-neutral-500 hover:bg-neutral-50"}`}>{x.label}</button>
        ))}
      </div>
      <div className="mt-2">
        {cur.quotes.length === 0 && <p className="py-4 text-[13px] text-neutral-500">{empty}</p>}
        {cur.quotes.map((q) => (
          <div key={q.name} className="grid grid-cols-[108px_minmax(0,1fr)_80px_58px] items-center gap-2 py-2 text-[13px]">
            <span className="flex min-w-0 items-center gap-1 font-semibold" title={INFO[q.name] ? (zh ? INFO[q.name].zh : INFO[q.name].en) : undefined}>
              {flagsOf(q.name).length > 0 && <span className="flex shrink-0 -space-x-0.5">{flagsOf(q.name).map((c) => <Flg key={c} c={c} />)}</span>}
              <span className="min-w-0"><span className="block truncate text-[12px]">{q.name}</span><span className="block truncate text-[10px] font-normal text-neutral-400">{unitOf(q.name, zh)}</span></span>
            </span>
            <Spark s={q.series} up={q.change >= 0} />
            <span className="whitespace-nowrap text-right tabular-nums">{q.value.toLocaleString("en-US", { minimumFractionDigits: q.digits, maximumFractionDigits: q.digits })}</span>
            <span className={`whitespace-nowrap text-right text-[11px] font-semibold tabular-nums ${q.change >= 0 ? "text-green-600" : "text-red-600"}`}>{q.change >= 0 ? "▲" : "▼"} {Math.abs(q.change).toFixed(2)}%</span>
          </div>
        ))}
      </div>
      {cur.quotes.some((q) => INFO[q.name]) && (
        <details className="mt-2 rounded-lg bg-[#F8F9FA] px-3 py-2 text-[12px] text-neutral-600">
          <summary className="cursor-pointer select-none font-medium text-neutral-700">{zh ? "这些是什么？" : "What are these?"}</summary>
          <dl className="mt-2 space-y-1.5">
            {cur.quotes.filter((q) => INFO[q.name]).map((q) => (
              <div key={q.name}><dt className="inline font-semibold text-neutral-800">{q.name}</dt><dd className="inline">{zh ? "：" : ": "}{zh ? INFO[q.name].zh : INFO[q.name].en}</dd></div>
            ))}
          </dl>
        </details>
      )}
      <p className="mt-2 text-right text-[11px] text-neutral-400">{cur.note}{updated ? ` · ${updated}` : ""}</p>
    </section>
  );
}
