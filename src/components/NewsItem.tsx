import Link from "@/components/LLink";
import type { Company, EventRow, Topic } from "@/lib/data";
import { TOPIC_ZH, type Lang } from "@/lib/i18n";
import { summary, timeAgoL, title } from "@/lib/loc";
import { Cover } from "./Cover";
import { Flags } from "./Flag";
import { CategoryLabel, StatusPill } from "./Pills";

export function NewsItem({ e, companies, topics, lang }: { e: EventRow; companies: Map<number, Company>; topics: Map<number, Topic>; lang: Lang }) {
  const tags = [
    ...e.company_ids.map((id) => companies.get(id)).filter(Boolean).slice(0, 3).map((c) => ({ label: c!.name, href: `/company/${c!.slug}` })),
    ...e.topic_ids.map((id) => topics.get(id)).filter(Boolean).slice(0, 2).map((t) => ({ label: lang === "zh" ? TOPIC_ZH[t!.slug] ?? t!.name : t!.name, href: `/topic/${t!.slug}` })),
  ];
  const topicSlug = topics.get(e.topic_ids[0])?.slug;
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
