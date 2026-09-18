"use client";
import { useState } from "react";
import type { Quote } from "@/lib/markets";

function Spark({ s, up }: { s: number[]; up: boolean }) {
  if (s.length < 2) return <span className="w-[56px]" />;
  const min = Math.min(...s), max = Math.max(...s), r = max - min || 1;
  const pts = s.map((v, i) => `${(i / (s.length - 1)) * 56},${18 - ((v - min) / r) * 16 - 1}`).join(" ");
  return <svg width="56" height="18" viewBox="0 0 56 18" aria-hidden="true"><polyline points={pts} fill="none" stroke={up ? "#15803D" : "#B91C1C"} strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}

export function Markets({ tabs, title, empty }: { tabs: { label: string; quotes: Quote[]; note: string }[]; updated?: string; title: string; empty: string }) {
  const [t, setT] = useState(0);
  const cur = tabs[t];
  return (
    <section>
      <div className="mb-3 flex items-baseline border-t-2 border-[#111111] pt-2.5">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{title}</h2>
        <div className="ml-auto flex gap-3 text-[13px]" role="tablist">
          {tabs.map((x, i) => (
            <button key={x.label} role="tab" aria-selected={i === t} onClick={() => setT(i)}
              className={`min-h-8 ${i === t ? "font-semibold text-[#111111] underline decoration-[#EA5514] decoration-2 underline-offset-4" : "text-neutral-500 hover:text-[#111111]"}`}>{x.label}</button>
          ))}
        </div>
      </div>
      {cur.quotes.length === 0 && <p className="py-4 text-[13px] text-neutral-500">{empty}</p>}
      <div className="divide-y divide-[#E6E6E6]">
        {cur.quotes.map((q) => (
          <div key={q.name} className="grid grid-cols-[92px_56px_minmax(0,1fr)_62px] items-center gap-2 py-2.5 text-[13px]">
            <span className="font-semibold">{q.name}</span>
            <Spark s={q.series} up={q.change >= 0} />
            <span className="text-right tabular-nums">{q.value.toLocaleString("en-US", { minimumFractionDigits: q.digits, maximumFractionDigits: q.digits })}</span>
            <span className={`text-right text-[12px] font-semibold tabular-nums ${q.change >= 0 ? "text-green-700" : "text-red-700"}`}>{q.change >= 0 ? "+" : "−"}{Math.abs(q.change).toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">{cur.note}</p>
    </section>
  );
}
