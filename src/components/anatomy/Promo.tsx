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
