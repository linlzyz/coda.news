"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Item = { id: number; name: string; sector: string; country: string | null; events: number; last: number; node: ReactNode; indices?: string[] };
const INDICES: [string, string][] = [["SP500", "S&P 500"], ["SP100", "S&P 100"], ["NDX100", "Nasdaq-100"]];
type T = { heading: string; all: string; search: string; recent: string; az: string; allCountries: string; none: string; more: string; count: string };

/** Sector tabs, country filter, search and sort for the companies grid. Cards are rendered on the server and passed in. */
export function Directory({ items, sectors, countries, t, sectorCards, middle }: { items: Item[]; sectors: [string, string][]; countries: [string, string, ReactNode][]; t: T; sectorCards: { k: string; node: ReactNode }[]; middle?: ReactNode }) {
  const [sector, setSector] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [index, setIndex] = useState<string>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "az">("recent");
  const [n, setN] = useState(48);
  const [cOpen, setCOpen] = useState(false);
  const cBox = useRef<HTMLDivElement>(null);
  useEffect(() => { const off = (e: MouseEvent) => { if (!cBox.current?.contains(e.target as Node)) setCOpen(false); }; document.addEventListener("mousedown", off); return () => document.removeEventListener("mousedown", off); }, []);
  const curC = countries.find(([c]) => c === country);
  // filters live in the URL, so going back from a company page returns to the same filtered list and scroll position
  const ready = useRef(false);
  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after hydration
    setSector(u.get("sector") ?? ""); setCountry(u.get("country") ?? ""); setIndex(u.get("index") ?? ""); setQ(u.get("q") ?? "");
    if (u.get("sort") === "az") setSort("az");
    const more = Number(u.get("n")); if (more > 48) setN(more);
    ready.current = true;
    let y = 0; try { y = Number(sessionStorage.getItem("co-scroll:" + location.search) ?? 0); } catch {}
    if (y) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    const save = () => { try { sessionStorage.setItem("co-scroll:" + location.search, String(window.scrollY)); } catch {} };
    window.addEventListener("pagehide", save); document.addEventListener("click", save, true);
    return () => { save(); window.removeEventListener("pagehide", save); document.removeEventListener("click", save, true); };
  }, []);
  useEffect(() => {
    if (!ready.current) return;
    const u = new URLSearchParams();
    if (sector) u.set("sector", sector); if (country) u.set("country", country); if (index) u.set("index", index);
    if (q.trim()) u.set("q", q.trim()); if (sort === "az") u.set("sort", "az"); if (n > 48) u.set("n", String(n));
    const qs = u.toString();
    window.history.replaceState(window.history.state, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }, [sector, country, index, q, sort, n]);
  const pick = (k: string) => { setSector(k); setN(48); document.getElementById("all")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = items.filter((i) => (!sector || i.sector === sector) && (!country || i.country === country) && (!index || i.indices?.includes(index)) && (!s || i.name.toLowerCase().includes(s)));
    return sort === "az" ? out.sort((a, b) => a.name.localeCompare(b.name)) : out.sort((a, b) => b.last - a.last || b.events - a.events);
  }, [items, sector, country, index, q, sort]);
  const chip = (active: boolean) => `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${active ? "border-[#16181D] bg-[#16181D] text-white" : "border-[#E5E7EB] bg-white text-neutral-700 hover:border-[#16181D]"}`;
  return (
    <div>
      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {sectorCards.map(({ k, node }) => <button key={k} type="button" onClick={() => pick(k)} className="text-left">{node}</button>)}
      </section>
      {middle}
      <div id="all" className="mt-12 scroll-mt-20" />
      <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.02em]">{t.heading}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" className={chip(!sector)} onClick={() => { setSector(""); setN(48); }}>{t.all}</button>
        {sectors.map(([k, label]) => <button key={k} type="button" className={chip(sector === k)} onClick={() => { setSector(k); setN(48); }}>{label}</button>)}
      </div>
      {/* stock indices */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {INDICES.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={index === k} onClick={() => { setIndex(index === k ? "" : k); setN(48); }}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${index === k ? "border-[#EA5514] bg-[#EA5514] text-white" : "border-[#F5D0BE] bg-[#FFF1EA] text-[#C2410C] hover:border-[#EA5514]"}`}>{label}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setN(48); }} placeholder={t.search} aria-label={t.search}
          className="h-10 min-w-[200px] flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[14px] outline-none focus:ring-2 focus:ring-[#FBD5C2]" />
        <div ref={cBox} className="relative">
          <button type="button" onClick={() => setCOpen((o) => !o)} aria-expanded={cOpen}
            className="flex h-10 min-w-[180px] items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[14px]">
            {curC ? <>{curC[2]}<span>{curC[1]}</span></> : <span>{t.allCountries}</span>}
            <span className="ml-auto text-neutral-400">▾</span>
          </button>
          {cOpen && (
            <div className="absolute right-0 z-30 mt-1 max-h-[340px] w-[240px] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,.12)]">
              <button type="button" onClick={() => { setCountry(""); setCOpen(false); setN(48); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-[#F4F5F7] ${!country ? "font-semibold" : ""}`}>{t.allCountries}</button>
              {countries.map(([c, label, flag]) => (
                <button key={c} type="button" onClick={() => { setCountry(c); setCOpen(false); setN(48); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] hover:bg-[#F4F5F7] ${country === c ? "font-semibold" : ""}`}>{flag}<span className="truncate">{label}</span></button>
              ))}
            </div>
          )}
        </div>
        <div className="flex rounded-xl border border-[#E5E7EB] bg-white p-1 text-[13px]">
          {(["recent", "az"] as const).map((k) => <button key={k} type="button" onClick={() => setSort(k)} className={`rounded-lg px-3 py-1.5 font-medium ${sort === k ? "bg-[#F4F5F7] text-[#16181D]" : "text-neutral-500"}`}>{k === "recent" ? t.recent : t.az}</button>)}
        </div>
        <span className="text-[13px] text-neutral-500">{t.count.replace("{n}", String(list.length))}</span>
      </div>
      {list.length === 0 ? <p className="py-12 text-center text-neutral-500">{t.none}</p> : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.slice(0, n).map((i) => <div key={i.id}>{i.node}</div>)}</div>
      )}
      {list.length > n && <div className="mt-6 text-center"><button type="button" onClick={() => setN(n + 48)} className="rounded-full border border-[#E5E7EB] px-6 py-2.5 text-[14px] font-medium hover:border-[#16181D]">{t.more}</button></div>}
    </div>
  );
}
