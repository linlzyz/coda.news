import type { EventRow } from "@/lib/data";
import { allTopics, companyMap } from "@/lib/data";
import { t, type Lang } from "@/lib/i18n";
import { dayLabel } from "@/lib/loc";
import { NewsItem } from "./NewsItem";

export async function EventList({ title, intro, events, lang, header }: { title: string; intro?: string; events: EventRow[]; lang: Lang; header?: React.ReactNode }) {
  const [companies, topics] = await Promise.all([companyMap(events), allTopics()]);
  const tm = new Map(topics.map((x) => [x.id, x]));
  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
      {header ?? (<>
        <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{title}</h1>
        {intro && <p className="mt-2 text-[16px] text-neutral-600">{intro}</p>}
      </>)}
      <div className="mt-4">{events.length ? [...events].sort((a, b) => Date.parse(b.last_article_at) - Date.parse(a.last_article_at)).map((e, k, arr) => (
        <div key={e.id}>
          {dayLabel(e.last_article_at, lang) !== (arr[k - 1] ? dayLabel(arr[k - 1].last_article_at, lang) : "") && <h3 className="mt-6 border-b border-[#16181D] pb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#16181D]">{dayLabel(e.last_article_at, lang)}</h3>}
          <NewsItem e={e} companies={companies} topics={tm} lang={lang} />
        </div>
      )) : <p className="py-10 text-neutral-500">{t(lang, "noEvents")}</p>}</div>
    </div>
  );
}
