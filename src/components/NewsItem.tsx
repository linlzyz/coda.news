import Link from "@/components/LLink";
import type { Company, EventRow, Topic } from "@/lib/data";
import { TOPIC_ZH, type Lang } from "@/lib/i18n";
import { summary, timeAgoL, title } from "@/lib/loc";
import { Cover } from "./Cover";
import { Flag, Flags } from "./Flag";
import { CategoryLabel, StatusPill } from "./Pills";

export function NewsItem({ e, companies, topics, lang }: { e: EventRow; companies: Map<number, Company>; topics: Map<number, Topic>; lang: Lang }) {
  const tags = [
    ...e.company_ids.map((id) => companies.get(id)).filter(Boolean).slice(0, 3).map((c) => ({ label: c!.name, href: `/company/${c!.slug}` })),
    ...e.topic_ids.map((id) => topics.get(id)).filter(Boolean).slice(0, 2).map((t) => ({ label: lang === "zh" ? TOPIC_ZH[t!.slug] ?? t!.name : t!.name, href: `/topic/${t!.slug}` })),
  ];
  const topicSlug = topics.get(e.topic_ids[0])?.slug;
  // one source only: a compact text card, our one-line summary plus a link to the original
  if (e.source_count < 2 && e.lead_url && e.lead_source) {
    const zh = lang === "zh";
    const t = title(e, lang).replace(/[。.]$/, "");
    return (
      <article className="border-b border-[#E5E7EB] py-4">
        <p className="text-[16px] leading-relaxed text-[#16181D]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">
            {zh ? <>据 <span className="font-semibold">{e.lead_source}</span> 报道，{t}。</> : <><span className="font-semibold">{e.lead_source}</span> reports: {t}.</>}
          </Link>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-neutral-500">
          <CategoryLabel category={e.category} lang={lang} />
          <span className="inline-flex items-center gap-1.5">{e.countries[0] && <Flag code={e.countries[0]} size={11} />}{e.lead_source}</span><span aria-hidden>·</span>
          <span>{timeAgoL(e.last_article_at, lang)}</span><span aria-hidden>·</span>
          <a href={e.lead_url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#C2410C] hover:underline">{zh ? "查看原文" : "Read original"} ↗</a>
        </div>
      </article>
    );
  }
  return (
    <article className="grid gap-5 border-b border-[#E5E7EB] py-5 sm:grid-cols-[208px_minmax(0,1fr)]">
      <Link href={`/event/${e.slug}`} className="block"><Cover e={e} iconName={topicSlug} className="aspect-[16/10] w-full rounded-2xl sm:h-[130px]" /></Link>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px]">
          <CategoryLabel category={e.category} lang={lang} />
          <span className="text-neutral-500">{timeAgoL(e.last_article_at, lang)}</span>
          <StatusPill status={e.status} lang={lang} />
        </div>
        <h3 className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#16181D]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, lang)}</Link>
        </h3>
        {summary(e, lang) && <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">{summary(e, lang)}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tags.map((t) => <Link key={t.href} href={t.href} className="rounded-full bg-[#F4F5F7] px-2.5 py-1 text-[12px] font-medium text-neutral-700 hover:bg-[#ECEEF1]">{t.label}</Link>)}
          <span className="ml-auto inline-flex items-center gap-2 text-[12px] text-neutral-500">
            {e.countries.length > 0 && <Flags codes={e.countries} max={5} size={11} />}
            {e.source_count} {lang === "zh" ? "个来源" : e.source_count === 1 ? "source" : "sources"}
          </span>
        </div>
      </div>
    </article>
  );
}
