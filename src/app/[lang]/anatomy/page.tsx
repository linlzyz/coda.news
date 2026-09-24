import Link from "@/components/LLink";
import { alternates, langFrom } from "@/lib/i18n";
import { PROFILES, money, photoUrl, pick } from "@/lib/anatomy";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  const p = PROFILES[0];
  return {
    title: l === "zh" ? "Coda 剖面" : "Coda Anatomy",
    description: l === "zh" ? "切开一家公司、一个行业或一次转折：决定、数字、利益关系，以及各国怎么讲。" : "Cutting open one company, industry or turning point: the decisions, the numbers, and how each country tells it.",
    alternates: alternates("/anatomy", l),
    openGraph: { images: [photoUrl(p.cover.file, 1200)] },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const zh = (await langFrom(params)) === "zh";
  const [lead, ...rest] = PROFILES;
  const s = lead.stats[0];
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 sm:px-8 sm:py-14">
      <div className="max-w-[640px]">
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#C2410C]">{zh ? "原创专题" : "Original long reads"}</div>
        <h1 className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.035em] sm:text-[56px]">{zh ? "Coda 剖面" : "Coda Anatomy"}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-neutral-600">
          {zh ? "切开一家公司、一个行业或一次转折，看清其中的决定、数字、利益关系，以及不同国家的讲法。每个数字都附来源。" : "We cut open one company, industry or turning point to show the decisions, the numbers, the interests involved and how different countries tell the story. Every number links to its source."}
        </p>
      </div>

      <Link href={`/anatomy/${lead.slug}`} className="group relative isolate mt-10 block overflow-hidden rounded-3xl bg-[#08090B] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(lead.cover.file, 1600)} alt={pick(lead.cover.alt, zh)}
          className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-75 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] sm:w-[75%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08090B] via-[#08090B]/75 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08090B]/90 via-transparent to-transparent" />
        <div className="flex min-h-[420px] flex-col justify-end p-6 sm:min-h-[480px] sm:p-10">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF8A50]">{String(lead.no).padStart(2, "0")} · {zh ? "最新" : "Latest"}</span>
          <span className="mt-2 block max-w-[560px] text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">{pick(lead.title, zh)}</span>
          <span className="mt-3 block max-w-[520px] text-[16px] leading-snug text-white/80 sm:text-[18px]">{pick(lead.dek, zh)}</span>
          <span className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3">
            <span>
              <span className="block text-[11px] uppercase tracking-[0.1em] text-white/50">{pick(s.label, zh)}</span>
              <span className="mt-1 block text-[26px] font-semibold tabular-nums tracking-[-0.02em]">{money(s.from, zh)} <span className="text-[#FF8A50]">→</span> {money(s.to, zh)}</span>
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#08090B] transition-colors group-hover:bg-[#FF8A50] group-hover:text-white">{zh ? "阅读剖面 →" : "Read the anatomy →"}</span>
          </span>
        </div>
      </Link>

      {rest.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {rest.map((p) => (
            <li key={p.slug}>
              <Link href={`/anatomy/${p.slug}`} className="group block overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(p.cover.file, 900)} alt={pick(p.cover.alt, zh)} loading="lazy" className="block aspect-[16/9] w-full object-cover" />
                <span className="block p-4">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C2410C]">{String(p.no).padStart(2, "0")}</span>
                  <span className="mt-1 block text-[22px] font-semibold tracking-[-0.02em] text-[#16181D] group-hover:text-[#C2410C]">{pick(p.title, zh)}</span>
                  <span className="mt-1 block text-[14px] text-neutral-600">{pick(p.dek, zh)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 grid gap-6 border-t border-[#E5E7EB] pt-8 sm:grid-cols-3">
        {(zh
          ? [["决定", "哪几个选择真正改变了结果，按时间排开。"], ["数字", "每个数字都能点开原始来源，图表附数据表。"], ["各国讲法", "同一件事，各国媒体分别强调什么。"]]
          : [["Decisions", "Which choices actually changed the outcome, in order."], ["Numbers", "Every figure links to its source; every chart has a data table."], ["Countries", "How outlets in each country told the same story."]]
        ).map(([h, t]) => (
          <div key={h}><div className="text-[15px] font-semibold text-[#16181D]">{h}</div><p className="mt-1 text-[14px] leading-relaxed text-neutral-600">{t}</p></div>
        ))}
      </div>
    </div>
  );
}
