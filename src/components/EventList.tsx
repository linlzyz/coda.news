import type { EventRow } from "@/lib/data";
import { allTopics, companyMap } from "@/lib/data";
import { getLang, t } from "@/lib/i18n";
import { NewsItem } from "./NewsItem";

export async function EventList({ title, intro, events }: { title: string; intro?: string; events: EventRow[] }) {
  const [companies, topics, lang] = await Promise.all([companyMap(events), allTopics(), getLang()]);
  const tm = new Map(topics.map((x) => [x.id, x]));
  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
      <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{title}</h1>
      {intro && <p className="mt-2 text-[16px] text-slate-600">{intro}</p>}
      <div className="mt-4">{events.length ? events.map((e) => <NewsItem key={e.id} e={e} companies={companies} topics={tm} lang={lang} />) : <p className="py-10 text-slate-500">{t(lang, "noEvents")}</p>}</div>
    </div>
  );
}
