"use client";
import { useState } from "react";
import type { Quote } from "@/lib/markets";

function Spark({ s, up }: { s: number[]; up: boolean }) {
  if (s.length < 2) return <span className="w-[64px]" />;
  const min = Math.min(...s), max = Math.max(...s), r = max - min || 1;
  const pts = s.map((v, i) => `${(i / (s.length - 1)) * 64},${20 - ((v - min) / r) * 18 - 1}`).join(" ");
  return <svg width="64" height="20" viewBox="0 0 64 20" aria-hidden="true"><polyline points={pts} fill="none" stroke={up ? "#16A34A" : "#DC2626"} strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

export function Markets({ tabs, updated, title, empty }: { tabs: { label: string; quotes: Quote[]; note: string }[]; updated: string; title: string; empty: string }) {
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
          <div key={q.name} className="grid grid-cols-[86px_64px_minmax(0,1fr)_62px] items-center gap-2 py-2 text-[13px]">
            <span className="font-semibold">{q.name}</span>
            <Spark s={q.series} up={q.change >= 0} />
            <span className="text-right tabular-nums">{q.value.toLocaleString("en-US", { minimumFractionDigits: q.digits, maximumFractionDigits: q.digits })}</span>
            <span className={`text-right text-[12px] font-semibold tabular-nums ${q.change >= 0 ? "text-green-600" : "text-red-600"}`}>{q.change >= 0 ? "▲" : "▼"} {Math.abs(q.change).toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-right text-[11px] text-neutral-400">{cur.note} · {updated}</p>
    </section>
  );
}
