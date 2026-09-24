"use client";
// Coda Anatomy figures. Animation only helps read order and size: it plays once when the figure scrolls into view,
// and readers with "reduce motion" get the finished picture straight away. Colours come from --ana-* in globals.css.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { money, type Point } from "@/lib/anatomy";

function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !("IntersectionObserver" in window)) { requestAnimationFrame(() => setOn(true)); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on] as const;
}

function Frame({ title, note, children, table }: { title: string; note?: ReactNode; children: ReactNode; table?: ReactNode }) {
  return (
    <figure className="my-8 rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
      <figcaption className="mb-3 text-[14px] font-semibold text-[#16181D]">{title}</figcaption>
      {children}
      {note && <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">{note}</p>}
      {table && <details className="mt-2 text-[12px] text-neutral-500"><summary className="cursor-pointer select-none">{"Data table / 数据表"}</summary><div className="mt-2 overflow-x-auto">{table}</div></details>}
    </figure>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left text-[12px] tabular-nums">
      <thead><tr>{head.map((h) => <th key={h} className="border-b border-[#E5E7EB] py-1 pr-3 font-semibold text-neutral-700">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-[#F0F1F3] py-1 pr-3">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/* ---------- 1. headline numbers ---------- */
export function CountUp({ from, to, unit, zh }: { from: number; to: number; unit: "bn" | "pct"; zh: boolean }) {
  const [ref, on] = useInView<HTMLSpanElement>(0.6);
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!on) return;
    const t0 = performance.now(), dur = 1500;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      // money grows geometrically so the count feels even from $2B to $1T
      setV(unit === "bn" ? from * Math.pow(to / from, e) : from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, from, to, unit]);
  return <span ref={ref} className="tabular-nums">{unit === "pct" ? `${Math.round(v)}%` : money(v, zh)}</span>;
}

/* ---------- shared line-chart geometry ---------- */
const W = 720, H = 300, M = { l: 76, r: 64, t: 16, b: 34 };
const X0 = 2014.6, X1 = 2026.72;
const sx = (x: number) => M.l + ((x - X0) / (X1 - X0)) * (W - M.l - M.r);
const path = (pts: Point[], sy: (v: number) => number) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.v).toFixed(1)}`).join("");
const YEARS = [2016, 2018, 2020, 2022, 2024, 2026];

function useHover(pts: Point[]) {
  const [i, setI] = useState<number | null>(null);
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, k) => { if (Math.abs(sx(p.x) - x) < Math.abs(sx(pts[best].x) - x)) best = k; });
    setI(best);
  };
  return { i, onMove, onLeave: () => setI(null) };
}

function Tip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const left = (x / W) * 100, flip = left > 70;
  return (
    <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-[#16181D] px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-lg"
      style={{ left: `${left}%`, top: `${(y / H) * 100}%`, transform: `translate(${flip ? "calc(-100% - 10px)" : "10px"}, -50%)` }}>{children}</div>
  );
}

/* ---------- 2. market value, log scale, with milestones ---------- */
export function CapChart({ pts, zh, marks }: { pts: Point[]; zh: boolean; marks: { x: number; label: string }[] }) {
  const [ref, on] = useInView<HTMLDivElement>();
  const lo = Math.log10(1), hi = Math.log10(1500);
  const sy = (v: number) => M.t + (1 - (Math.log10(v) - lo) / (hi - lo)) * (H - M.t - M.b);
  const at = (x: number) => { // value on the line at x (log interpolation)
    const k = pts.findIndex((p) => p.x >= x);
    if (k <= 0) return pts[0].v;
    const a = pts[k - 1], b = pts[k], f = (x - a.x) / (b.x - a.x);
    return Math.pow(10, Math.log10(a.v) + f * (Math.log10(b.v) - Math.log10(a.v)));
  };
  const h = useHover(pts);
  const ticks: [number, string][] = [[1, zh ? "10 亿" : "$1B"], [10, zh ? "100 亿" : "$10B"], [100, zh ? "1000 亿" : "$100B"], [1000, zh ? "1 万亿" : "$1T"]];
  return (
    <Frame title={zh ? "AMD 市值，2014 至 2026（美元，对数刻度）" : "AMD market value, 2014 to 2026 (US$, log scale)"}
      note={zh ? "年末市值；最后一点为 2026 年 9 月 21 日。对数刻度：每条横线是上一条的 10 倍。来源：CompaniesMarketCap。" : "Year-end values; the last point is 21 September 2026. Log scale: each gridline is ten times the one below. Source: CompaniesMarketCap."}
      table={<Table head={[zh ? "年份" : "Year", zh ? "市值" : "Market value"]} rows={pts.map((p) => [p.label, money(p.v, zh)])} />}>
      <div ref={ref} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={zh ? "AMD 市值从约 21 亿美元升至约 1 万亿美元" : "AMD market value rising from about $2.1 billion to about $1 trillion"}>
          {ticks.map(([v, t]) => <g key={v}><line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className="ana-grid" /><text x={M.l - 8} y={sy(v)} dy="0.32em" textAnchor="end" className="ana-axis">{t}</text></g>)}
          {YEARS.map((y) => <text key={y} x={sx(y)} y={H - 8} textAnchor="middle" className="ana-axis">{y}</text>)}
          <path d={path(pts, sy)} pathLength={1} className="ana-line ana-amd ana-draw" style={{ strokeDashoffset: on ? 0 : 1 }} />
          {marks.map((m, k) => {
            const cx = sx(m.x), cy = sy(at(m.x)), d = (0.2 + (k / marks.length) * 1.6).toFixed(2);
            return (
              <g key={k} className="ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: `${d}s` }}>
                <circle cx={cx} cy={cy} r={9} className="ana-mark" />
                <text x={cx} y={cy} dy="0.34em" textAnchor="middle" className="ana-marknum">{k + 1}</text>
              </g>
            );
          })}
          <text x={sx(X1) + 12} y={sy(1003)} dy="0.32em" className="ana-endlabel ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: "1.9s" }}>{zh ? "1 万亿" : "$1T"}</text>
          {h.i !== null && <g><line x1={sx(pts[h.i].x)} x2={sx(pts[h.i].x)} y1={M.t} y2={H - M.b} className="ana-cross" /><circle cx={sx(pts[h.i].x)} cy={sy(pts[h.i].v)} r={5} className="ana-dot ana-amd-fill" /></g>}
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent" onPointerMove={h.onMove} onPointerLeave={h.onLeave} />
        </svg>
        {h.i !== null && <Tip x={sx(pts[h.i].x)} y={sy(pts[h.i].v)}><b>{pts[h.i].label}</b> · {money(pts[h.i].v, zh)}</Tip>}
      </div>
      <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-[12.5px] text-neutral-600 sm:grid-cols-2">
        {marks.map((m, k) => <li key={k} className="flex gap-2"><span className="ana-chip">{k + 1}</span>{m.label}</li>)}
      </ol>
    </Frame>
  );
}

/* ---------- 3. AMD vs Intel ---------- */
export function VsIntel({ amd: a0, intel: i0, zh }: { amd: Point[]; intel: Point[]; zh: boolean }) {
  // add the close of 15 Feb 2022, when AMD first passed Intel, so both lines run through the marked crossing
  const at = a0.findIndex((p) => p.x > 2022.12);
  const amd = [...a0.slice(0, at), { x: 2022.12, label: zh ? "2022.2.15" : "15 Feb 2022", v: 197.75 }, ...a0.slice(at)];
  const intel = [...i0.slice(0, at), { x: 2022.12, label: zh ? "2022.2.15" : "15 Feb 2022", v: 197.24 }, ...i0.slice(at)];
  const [ref, on] = useInView<HTMLDivElement>();
  const top = 1100;
  const sy = (v: number) => M.t + (1 - v / top) * (H - M.t - M.b);
  const h = useHover(amd);
  const cross = { x: 2022.12, v: 197.75 };
  return (
    <Frame title={zh ? "AMD 与 Intel 市值（十亿美元）" : "AMD and Intel market value ($ billion)"}
      note={zh ? "年末市值，最后一点为 2026 年 9 月 21 日前后。圆圈：2022 年 2 月 15 日收盘，AMD 1,977.5 亿美元对 Intel 1,972.4 亿美元，首次超过；2022 年末 Intel 又略微领先。来源：CompaniesMarketCap、Tom's Hardware。" : "Year-end values; the last point is around 21 September 2026. Circle: close on 15 February 2022, AMD $197.75bn vs Intel $197.24bn, the first time AMD was larger; Intel was slightly ahead again at the end of 2022. Sources: CompaniesMarketCap, Tom's Hardware."}
      table={<Table head={[zh ? "年份" : "Year", "AMD", "Intel"]} rows={amd.map((p, k) => [p.label, money(p.v, zh), money(intel[k].v, zh)])} />}>
      <div className="mb-2 flex gap-4 text-[12px] text-neutral-600">
        <span className="inline-flex items-center gap-1.5"><span className="ana-key ana-amd-bg" />AMD</span>
        <span className="inline-flex items-center gap-1.5"><span className="ana-key ana-intel-bg" />Intel</span>
      </div>
      <div ref={ref} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={zh ? "AMD 市值在 2022 年超过 Intel，2026 年远高于 Intel" : "AMD's market value passes Intel's in 2022 and is far larger by 2026"}>
          {[0, 250, 500, 750, 1000].map((v) => <g key={v}><line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className={v ? "ana-grid" : "ana-base"} /><text x={M.l - 8} y={sy(v)} dy="0.32em" textAnchor="end" className="ana-axis">{v ? (zh ? (v >= 1000 ? "1 万亿" : `${v * 10} 亿`) : `$${v}B`) : "0"}</text></g>)}
          {YEARS.map((y) => <text key={y} x={sx(y)} y={H - 8} textAnchor="middle" className="ana-axis">{y}</text>)}
          <path d={path(intel, sy)} pathLength={1} className="ana-line ana-intel ana-draw" style={{ strokeDashoffset: on ? 0 : 1 }} />
          <path d={path(amd, sy)} pathLength={1} className="ana-line ana-amd ana-draw" style={{ strokeDashoffset: on ? 0 : 1 }} />
          <g className="ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: "1.3s" }}>
            <circle cx={sx(cross.x)} cy={sy(cross.v)} r={11} className="ana-ring" />
            <text x={sx(cross.x)} y={sy(cross.v) - 18} textAnchor="middle" className="ana-note">{zh ? "2022.2 首次超过" : "Feb 2022: first pass"}</text>
          </g>
          <text x={sx(X1) + 10} y={sy(1003)} dy="0.32em" className="ana-endlabel ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: "1.9s" }}>AMD</text>
          <text x={sx(X1) + 10} y={sy(654.73)} dy="0.32em" className="ana-endlabel ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: "1.9s" }}>Intel</text>
          {h.i !== null && <g><line x1={sx(amd[h.i].x)} x2={sx(amd[h.i].x)} y1={M.t} y2={H - M.b} className="ana-cross" />
            <circle cx={sx(intel[h.i].x)} cy={sy(intel[h.i].v)} r={5} className="ana-dot ana-intel-fill" /><circle cx={sx(amd[h.i].x)} cy={sy(amd[h.i].v)} r={5} className="ana-dot ana-amd-fill" /></g>}
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent" onPointerMove={h.onMove} onPointerLeave={h.onLeave} />
        </svg>
        {h.i !== null && <Tip x={sx(amd[h.i].x)} y={sy(Math.max(amd[h.i].v, intel[h.i].v))}><b>{amd[h.i].label}</b><br />AMD {money(amd[h.i].v, zh)}<br />Intel {money(intel[h.i].v, zh)}</Tip>}
      </div>
    </Frame>
  );
}

/* ---------- 4. revenue bars, 2025 split ---------- */
export function RevenueBars({ rows, zh }: { rows: { year: number; v: number; dc?: number }[]; zh: boolean }) {
  const [ref, on] = useInView<HTMLDivElement>();
  const [hi, setHi] = useState<number | null>(null);
  const BW = 720, BH = 260, m = { l: 44, r: 12, t: 24, b: 28 }, top = 40;
  const slot = (BW - m.l - m.r) / rows.length, bw = Math.min(34, slot - 8);
  const sy = (v: number) => m.t + (1 - v / top) * (BH - m.t - m.b);
  const last = rows[rows.length - 1];
  return (
    <Frame title={zh ? "AMD 年营收（十亿美元）" : "AMD annual revenue ($ billion)"}
      note={zh ? `2025 年营收 ${money(last.v, true)}，其中数据中心 ${money(last.dc ?? 0, true)}，约占 ${Math.round(((last.dc ?? 0) / last.v) * 100)}%。来源：CompaniesMarketCap、AMD 2025 年全年业绩。` : `2025 revenue ${money(last.v, false)}, of which data centre ${money(last.dc ?? 0, false)} (about ${Math.round(((last.dc ?? 0) / last.v) * 100)}%). Sources: CompaniesMarketCap, AMD full-year 2025 results.`}
      table={<Table head={[zh ? "年份" : "Year", zh ? "营收（十亿美元）" : "Revenue ($bn)"]} rows={rows.map((r) => [r.year, r.v])} />}>
      <div className="mb-2 flex gap-4 text-[12px] text-neutral-600">
        <span className="inline-flex items-center gap-1.5"><span className="ana-key ana-neutral-bg" />{zh ? "总营收" : "Total revenue"}</span>
        <span className="inline-flex items-center gap-1.5"><span className="ana-key ana-amd-bg" />{zh ? "其中数据中心（2025）" : "Of which data centre (2025)"}</span>
      </div>
      <div ref={ref} className="relative">
        <svg viewBox={`0 0 ${BW} ${BH}`} className="block h-auto w-full" role="img" aria-label={zh ? "AMD 营收从 2014 年 55 亿美元增至 2025 年 346 亿美元" : "AMD revenue grows from $5.5bn in 2014 to $34.6bn in 2025"}>
          {[0, 10, 20, 30, 40].map((v) => <g key={v}><line x1={m.l} x2={BW - m.r} y1={sy(v)} y2={sy(v)} className={v ? "ana-grid" : "ana-base"} /><text x={m.l - 8} y={sy(v)} dy="0.32em" textAnchor="end" className="ana-axis">{v}</text></g>)}
          {rows.map((r, k) => {
            const x = m.l + k * slot + (slot - bw) / 2, d = `${(k * 0.07).toFixed(2)}s`;
            const tot = sy(0) - sy(r.v), dc = r.dc ? sy(0) - sy(r.dc) : 0;
            return (
              <g key={r.year} className="ana-grow" style={{ transform: on ? "scaleY(1)" : "scaleY(0)", transitionDelay: d, transformOrigin: `0 ${sy(0)}px` }}
                onPointerEnter={() => setHi(k)} onPointerLeave={() => setHi(null)}>
                <rect x={x - 4} y={m.t} width={bw + 8} height={BH - m.t - m.b} fill="transparent" />
                <path d={`M${x},${sy(0) - dc - 1}v${-(tot - dc - 5)}q0,-4 4,-4h${bw - 8}q4,0 4,4v${tot - dc - 5}z`} className="ana-neutral-fill" opacity={hi === null || hi === k ? 1 : 0.55} />
                {r.dc && <rect x={x} y={sy(0) - dc + 1} width={bw} height={dc - 1} className="ana-amd-fill" />}
                {(k === 0 || k === rows.length - 1) && <text x={x + bw / 2} y={sy(r.v) - 6} textAnchor="middle" className="ana-value">{r.v}</text>}
                {k % 2 === 0 || k === rows.length - 1 ? <text x={x + bw / 2} y={BH - 8} textAnchor="middle" className="ana-axis">{r.year}</text> : null}
              </g>
            );
          })}
        </svg>
        {hi !== null && <Tip x={m.l + hi * slot + slot / 2} y={sy(rows[hi].v)}><b>{rows[hi].year}</b> · {money(rows[hi].v, zh)}{rows[hi].dc ? <><br />{zh ? "数据中心" : "Data centre"} {money(rows[hi].dc!, zh)}</> : null}</Tip>}
      </div>
    </Frame>
  );
}

/* ---------- 5. why chiplets: same area, same defects ---------- */
export function Chiplet({ zh }: { zh: boolean }) {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  const S = 200, defects = [[0.2, 0.3], [0.7, 0.2], [0.3, 0.8]];
  const panel = (n: number, ox: number) => {
    const c = S / n, gap = 4;
    const hit = new Set(defects.map(([x, y]) => `${Math.floor(x * n)},${Math.floor(y * n)}`));
    const good = n * n - hit.size;
    return (
      <g transform={`translate(${ox},20)`}>
        {Array.from({ length: n * n }, (_, i) => {
          const cx = i % n, cy = Math.floor(i / n), bad = hit.has(`${cx},${cy}`);
          return (
            <g key={i}>
              <rect x={cx * c + gap / 2} y={cy * c + gap / 2} width={c - gap} height={c - gap} rx={4} className={bad && on ? "ana-die-bad" : "ana-die"} style={{ transitionDelay: bad ? "1.1s" : "0s" }} />
              {bad && <g className="ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: "1.2s" }}>
                <path d={`M${cx * c + c / 2 - 6},${cy * c + c / 2 - 6}l12,12M${cx * c + c / 2 + 6},${cy * c + c / 2 - 6}l-12,12`} className="ana-x" /></g>}
            </g>
          );
        })}
        {defects.map(([x, y], k) => (
          <circle key={k} cx={x * S} cy={y * S} r={5} className="ana-defect ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: `${0.3 + k * 0.2}s` }} />
        ))}
        <text x={S / 2} y={S + 26} textAnchor="middle" className="ana-panel">{n === 2 ? (zh ? "4 块大芯片" : "4 large dies") : (zh ? "16 块小芯片" : "16 small dies")}</text>
        <text x={S / 2} y={S + 46} textAnchor="middle" className="ana-result ana-pop" style={{ opacity: on ? 1 : 0, transitionDelay: "1.5s" }}>
          {zh ? `好 ${good} 块（${Math.round((good / (n * n)) * 100)}%）` : `${good} good (${Math.round((good / (n * n)) * 100)}%)`}
        </text>
      </g>
    );
  };
  return (
    <Frame title={zh ? "为什么拆成小芯片：同样面积，同样 3 个缺陷" : "Why chiplets: same area, same three defects"}
      note={zh ? "示意图，不是 AMD 的实际良率。红点是制造缺陷，落在哪块芯片上，那块就报废。小芯片越小，一个缺陷浪费的面积越少；同一种小芯片还能拼成不同核数的产品。" : "Illustration, not AMD's actual yields. Red dots are manufacturing defects; any die a defect lands on is lost. Smaller dies waste less area per defect, and the same die can be combined into products with different core counts."}>
      <div ref={ref}>
        <svg viewBox="0 0 560 290" className="mx-auto block h-auto w-full max-w-[560px]" role="img" aria-label={zh ? "同样面积的晶圆，3 个缺陷让 4 块大芯片坏 3 块，16 块小芯片只坏 3 块" : "Three defects ruin 3 of 4 large dies but only 3 of 16 small dies"}>
          {panel(2, 40)}
          {panel(4, 320)}
        </svg>
      </div>
    </Frame>
  );
}

/* ---------- 6. AI capacity deals ---------- */
export function Deals({ deals, zh }: { deals: { name: string; gw: number; date: { en: string; zh: string } }[]; zh: boolean }) {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  const k = 34, max = Math.max(...deals.map((d) => d.gw));
  const R = (gw: number) => k * Math.sqrt(gw);
  let x = 20;
  const placed = deals.map((d) => { const r = R(d.gw); const cx = x + r; x += 2 * r + 28; return { ...d, r, cx }; });
  const VW = x, VH = 2 * R(max) + 20;
  return (
    <Frame title={zh ? "AI 算力大单（最多可部署的吉瓦数）" : "AI capacity deals (maximum gigawatts)"}
      note={zh ? "圆的面积与吉瓦数成正比。这些都是多年分期的\"最多\"容量，不是已经交付的数量。另外，Oracle 于 2025 年 10 月订购 5 万颗 MI450。来源：OpenAI、metir。" : "Circle area is proportional to gigawatts. These are multi-year \"up to\" capacities, not amounts already delivered. Separately, Oracle ordered 50,000 MI450 chips in October 2025. Sources: OpenAI, metir."}>
      <div ref={ref}>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="mx-auto block h-auto w-full max-w-[640px]" role="img" aria-label={deals.map((d) => `${d.name} ${d.gw} GW`).join(", ")}>
          {placed.map((d, i) => (
            <g key={d.name} className="ana-scale" style={{ transform: on ? "scale(1)" : "scale(0)", transformOrigin: `${d.cx}px ${VH / 2}px`, transitionDelay: `${i * 0.35}s` }}>
              <circle cx={d.cx} cy={VH / 2} r={d.r} className="ana-bubble" />
              <text x={d.cx} y={VH / 2 - (d.r > 60 ? 14 : 8)} textAnchor="middle" className="ana-bname">{d.name}</text>
              <text x={d.cx} y={VH / 2 + (d.r > 60 ? 12 : 10)} textAnchor="middle" className="ana-bval">{zh ? `最多 ${d.gw} 吉瓦` : `up to ${d.gw} GW`}</text>
              {d.r > 60 && <text x={d.cx} y={VH / 2 + 32} textAnchor="middle" className="ana-axis">{zh ? d.date.zh : d.date.en}</text>}
            </g>
          ))}
        </svg>
        {placed.some((d) => d.r <= 60) && <p className="mt-1 text-center text-[12px] text-neutral-500">{placed.filter((d) => d.r <= 60).map((d) => `${d.name}: ${zh ? d.date.zh : d.date.en}`).join(" · ")}</p>}
      </div>
    </Frame>
  );
}

/* ---------- 7. timeline, lights up as you scroll ---------- */
export function TimelineRow({ date, children, last }: { date: string; children: ReactNode; last?: boolean }) {
  const [ref, on] = useInView<HTMLLIElement>(0.8);
  return (
    <li ref={ref} className={`ana-tl grid grid-cols-[96px_1fr] gap-3 sm:grid-cols-[128px_1fr] sm:gap-4 ${on ? "is-on" : ""}`}>
      <span className="pt-0.5 text-right text-[12.5px] font-semibold tabular-nums text-neutral-500">{date}</span>
      <span className="relative pb-5 pl-6 text-[14.5px] leading-snug text-neutral-800">
        <span className="ana-tl-dot" aria-hidden />
        {!last && <span className="ana-tl-line" aria-hidden />}
        <span className="ana-tl-text block">{children}</span>
      </span>
    </li>
  );
}
