"use client";
import { useState, type ReactNode } from "react";
export function Tabs({ tabs }: { tabs: { k: string; label: string; node: ReactNode }[] }) {
  const [cur, setCur] = useState(tabs[0]?.k);
  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border-b border-[#E5E7EB] text-[14px]" role="tablist">
        {tabs.map((t) => (
          <button key={t.k} type="button" role="tab" aria-selected={cur === t.k} onClick={() => setCur(t.k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-1 py-3 font-medium ${cur === t.k ? "border-[#EA5514] text-[#16181D]" : "border-transparent text-neutral-500 hover:text-[#16181D]"}`}>{t.label}</button>
        ))}
      </div>
      {tabs.map((t) => <div key={t.k} hidden={cur !== t.k} className="pt-6">{t.node}</div>)}
    </div>
  );
}
