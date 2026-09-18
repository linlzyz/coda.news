"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Index = { c: [string, string, string, string, string, number][]; t: [string, string, string][]; e: [string, string, string][] };
type Hit = { kind: "c" | "t" | "e"; label: string; sub?: string; href: string; logo?: string };
let cache: Promise<Index> | null = null;
const load = () => (cache ??= fetch("/search-index.json").then((r) => r.json()));

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
// prefix match beats word-start match beats substring match
function score(q: string, ...names: string[]) {
  let best = 0;
  for (const raw of names) {
    if (!raw) continue; const n = norm(raw);
    if (n.startsWith(q)) best = Math.max(best, 3);
    else if (n.split(/[\s\-.&/]+/).some((w) => w.startsWith(q))) best = Math.max(best, 2);
    else if (n.includes(q)) best = Math.max(best, 1);
  }
  return best;
}

/** Search field with instant suggestions: type "a" and companies starting with A appear. */
export function SearchBox({ lang, placeholder, variant = "bar" }: { lang: "en" | "zh"; placeholder: string; variant?: "bar" | "hero" }) {
  const zh = lang === "zh"; const p = zh ? "/zh" : "";
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState<Index | null>(null);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const off = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", off); return () => document.removeEventListener("mousedown", off); }, []);

  const hits = useMemo<Hit[]>(() => {
    const s = norm(q.trim()); if (!s || !idx) return [];
    const cs = idx.c.map((c) => ({ c, s: score(s, c[0], c[1]) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.c[5] - a.c[5]).slice(0, 6)
      .map(({ c }) => ({ kind: "c" as const, label: (zh && c[1]) || c[0], sub: zh && c[1] && c[1] !== c[0] ? c[0] : undefined, href: `${p}/company/${c[2]}`, logo: c[3] }));
    const ts = idx.t.map((t) => ({ t, s: score(s, t[0], t[1]) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3)
      .map(({ t }) => ({ kind: "t" as const, label: (zh && t[1]) || t[0], href: `${p}/topic/${t[2]}` }));
    const es = s.length < 2 ? [] : idx.e.map((e) => ({ e, s: score(s, e[0], e[1]) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 4)
      .map(({ e }) => ({ kind: "e" as const, label: (zh && e[1]) || e[0], href: `${p}/event/${e[2]}` }));
    return [...cs, ...ts, ...es];
  }, [q, idx, zh, p]);

  const go = (href: string) => { setOpen(false); router.push(href); };
  const submit = () => { if (sel >= 0 && hits[sel]) go(hits[sel].href); else if (q.trim()) go(`${p}/search?q=${encodeURIComponent(q.trim())}`); };
  const head = { c: zh ? "公司" : "Companies", t: zh ? "话题" : "Topics", e: zh ? "新闻" : "News" };

  return (
    <div ref={box} className={`relative ${variant === "bar" ? "hidden max-w-[560px] flex-1 sm:block" : ""}`}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}
        className={variant === "bar"
          ? "flex items-center gap-2.5 rounded-xl bg-[#F4F5F7] px-4 text-neutral-500 focus-within:ring-2 focus-within:ring-[#FBD5C2]"
          : "flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white py-1.5 pl-5 pr-1.5 shadow-[0_2px_10px_rgba(0,0,0,.04)]"}>
        {variant === "bar" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>}
        <input value={q} type="search" aria-label="Search" placeholder={placeholder} autoComplete="off"
          onFocus={() => { setOpen(true); load().then(setIdx).catch(() => {}); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setSel(-1); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, -1)); }
            else if (e.key === "Escape") setOpen(false);
          }}
          className={`${variant === "bar" ? "h-11" : "h-10"} min-w-0 flex-1 bg-transparent text-[14px] text-[#16181D] outline-none placeholder:text-neutral-400`} />
        {variant === "hero" && <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16181D] text-white" aria-label="Search">→</button>}
      </form>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white py-2 shadow-[0_12px_40px_rgba(0,0,0,.12)]">
          {!idx && <div className="px-4 py-3 text-[13px] text-neutral-500">…</div>}
          {idx && hits.length === 0 && <div className="px-4 py-3 text-[13px] text-neutral-500">{zh ? "没有找到，按回车搜索全部内容" : "No matches. Press Enter to search everything"}</div>}
          {hits.map((h, i) => (
            <div key={h.href}>
              {(i === 0 || hits[i - 1].kind !== h.kind) && <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{head[h.kind]}</div>}
              <button type="button" onMouseEnter={() => setSel(i)} onClick={() => go(h.href)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-[14px] ${sel === i ? "bg-[#F4F5F7]" : ""}`}>
                {h.kind === "c" && <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-white text-[12px] font-semibold">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.logo ? <img src={h.logo} alt="" className="max-h-[70%] max-w-[80%] object-contain" /> : h.label.slice(0, 1).toUpperCase()}</span>}
                <span className="min-w-0 flex-1 truncate">{h.label}{h.sub && <span className="ml-2 text-neutral-400">{h.sub}</span>}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
