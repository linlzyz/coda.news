"use client";
import { useState, type ReactNode } from "react";
import Link from "@/components/LLink";

/** Latest-news list with category tabs and "load more", all in the browser (the page itself stays static and fast). */
export function Feed({ items, tabs, title, more, disclaimer, note, links = false }: {
  items: { tags: string[]; hideInAll?: boolean; node: ReactNode; day?: string; at?: number }[]; tabs: [string, string | undefined][]; title: string; more: string; disclaimer: string; note?: string;
  /** tabs are links to section pages instead of filters (keeps the home page small) */ links?: boolean;
}) {
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [n, setN] = useState(15);
  // newest first, grouped under day headings
  const list = items.filter((i) => (tab ? i.tags.includes(tab) : !i.hideInAll)).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  return (
    <section>
      <div className="flex items-center gap-5 border-b border-[#E5E7EB]">
        <h2 className="flex shrink-0 items-baseline gap-2 whitespace-nowrap py-3 text-[22px] font-semibold tracking-[-0.02em]">{title}{note && <span className="text-[12px] font-normal tracking-normal text-neutral-400">{note}</span>}</h2>
        <nav className="flex gap-1 overflow-x-auto text-[13px]" role="tablist">
          {tabs.map(([label, v]) => links ? (
            v === undefined
              ? <span key={label} className="whitespace-nowrap border-b-2 border-[#C2410C] px-3 py-3 font-medium text-[#C2410C]">{label}</span>
              : <Link key={label} href={`/${v}`} className="whitespace-nowrap border-b-2 border-transparent px-3 py-3 font-medium text-neutral-500 hover:text-[#16181D]">{label}</Link>
          ) : (
            <button key={label} role="tab" aria-selected={v === tab} onClick={() => { setTab(v); setN(15); }}
              className={`whitespace-nowrap border-b-2 px-3 py-3 font-medium ${v === tab ? "border-[#C2410C] text-[#C2410C]" : "border-transparent text-neutral-500 hover:text-[#16181D]"}`}>{label}</button>
          ))}
        </nav>
      </div>
      {list.slice(0, n).map((i, k, arr) => (
        <div key={k}>
          {i.day && i.day !== arr[k - 1]?.day && <h3 className="mt-6 border-b border-[#16181D] pb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#16181D]">{i.day}</h3>}
          {i.node}
        </div>
      ))}
      {list.length > n && <div className="mt-6 text-center"><button type="button" onClick={() => setN(n + 15)} className="rounded-full border border-[#E5E7EB] px-6 py-2.5 text-[14px] font-medium hover:border-[#16181D]">{more}</button></div>}
      <p className="mt-4 text-[12px] leading-relaxed text-neutral-500">{disclaimer}</p>
    </section>
  );
}
