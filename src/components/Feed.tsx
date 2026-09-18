"use client";
import { useState, type ReactNode } from "react";

/** Latest-news list with category tabs and "load more", all in the browser (the page itself stays static and fast). */
export function Feed({ items, tabs, title, more, disclaimer }: {
  items: { cat: string; node: ReactNode }[]; tabs: [string, string | undefined][]; title: string; more: string; disclaimer: string;
}) {
  const [tab, setTab] = useState<string | undefined>(undefined);
  const [n, setN] = useState(15);
  const list = items.filter((i) => !tab || i.cat === tab);
  return (
    <section>
      <div className="flex items-center gap-5 border-b border-[#E5E7EB]">
        <h2 className="whitespace-nowrap py-3 text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
        <nav className="flex gap-1 overflow-x-auto text-[13px]" role="tablist">
          {tabs.map(([label, v]) => (
            <button key={label} role="tab" aria-selected={v === tab} onClick={() => { setTab(v); setN(15); }}
              className={`whitespace-nowrap border-b-2 px-3 py-3 font-medium ${v === tab ? "border-[#C2410C] text-[#C2410C]" : "border-transparent text-neutral-500 hover:text-[#16181D]"}`}>{label}</button>
          ))}
        </nav>
      </div>
      {list.slice(0, n).map((i, k) => <div key={k}>{i.node}</div>)}
      {list.length > n && <div className="mt-6 text-center"><button type="button" onClick={() => setN(n + 15)} className="rounded-full border border-[#E5E7EB] px-6 py-2.5 text-[14px] font-medium hover:border-[#16181D]">{more}</button></div>}
      <p className="mt-4 text-[12px] leading-relaxed text-neutral-500">{disclaimer}</p>
    </section>
  );
}
