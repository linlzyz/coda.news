import Link from "@/components/LLink";
import { PROFILES, money, photoUrl, pick } from "@/lib/anatomy";

/** "Coda Anatomy" card on company and event pages about the same company: a way in for readers and an internal link for search engines. */
export function AnatomyPromo({ companyIds, zh }: { companyIds: (number | string)[] | null | undefined; zh: boolean }) {
  const ids = new Set((companyIds ?? []).map(Number));
  const p = PROFILES.find((x) => ids.has(x.companyId));
  if (!p) return null;
  const s = p.stats[0];
  return (
    <Link href={`/anatomy/${p.slug}`} className="group relative isolate flex overflow-hidden rounded-2xl bg-[#08090B] text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoUrl(p.cover.file, 900)} alt="" loading="lazy" className="absolute inset-y-0 right-0 -z-10 h-full w-2/3 object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08090B] via-[#08090B]/85 to-transparent" />
      <span className="flex flex-col p-5 sm:p-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF8A50]">{zh ? `Coda 剖面 ${String(p.no).padStart(2, "0")} · 深度阅读` : `Coda Anatomy ${String(p.no).padStart(2, "0")} · Long read`}</span>
        <span className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[26px]">{pick(p.title, zh)}</span>
        <span className="mt-1 max-w-[440px] text-[13.5px] leading-snug text-white/75">{pick(p.dek, zh)}</span>
        <span className="mt-3 text-[13px] font-semibold text-white">{money(s.from, zh)} <span className="text-[#FF8A50]">→</span> {money(s.to, zh)} · <span className="group-hover:underline">{zh ? "阅读剖面 →" : "Read →"}</span></span>
      </span>
    </Link>
  );
}

/** Home page sidebar box: the latest Coda Anatomy, above Top topics. */
export function AnatomyBox({ zh }: { zh: boolean }) {
  const p = [...PROFILES].sort((a, b) => b.no - a.no)[0];
  if (!p) return null;
  const s = p.stats[0];
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <Link href={`/anatomy/${p.slug}`} className="group block">
        <span className="relative isolate block aspect-[16/9] overflow-hidden bg-[#08090B]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(p.cover.file, 700)} alt={pick(p.cover.alt, zh)} loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08090B]/90 via-[#08090B]/20 to-transparent" />
          <span className="absolute left-4 top-4 rounded bg-[#EA5514] px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white">{zh ? `Coda 剖面 ${String(p.no).padStart(2, "0")}` : `Coda Anatomy ${String(p.no).padStart(2, "0")}`}</span>
          <span className="absolute bottom-3 left-4 right-4 text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{money(s.from, zh)} <span className="text-[#FF8A50]">→</span> {money(s.to, zh)}</span>
        </span>
        <span className="block p-5 pb-3">
          <span className="block text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#16181D] group-hover:text-[#C2410C]">{pick(p.title, zh)}</span>
          <span className="mt-1.5 block text-[13px] leading-relaxed text-neutral-600">{pick(p.dek, zh)}</span>
        </span>
      </Link>
      <div className="flex items-center px-5 pb-4 text-[12px]">
        <Link href={`/anatomy/${p.slug}`} className="font-semibold text-[#C2410C] hover:underline">{zh ? "阅读剖面 →" : "Read →"}</Link>
        <Link href="/anatomy" className="ml-auto text-neutral-500 hover:text-[#C2410C]">{zh ? "全部原创专题" : "All long reads"}</Link>
      </div>
    </section>
  );
}
