import type { EventRow } from "@/lib/data";
import { allTopics } from "@/lib/data";
import { getLang, t } from "@/lib/i18n";
import { StoryRow } from "./Story";

export async function EventList({ title, intro, events }: { title: string; intro?: string; events: EventRow[] }) {
  const [topics, lang] = await Promise.all([allTopics(), getLang()]);
  const tm = new Map(topics.map((x) => [x.id, x.slug]));
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="border-b-2 border-[#111111] pb-4 text-[40px] font-semibold tracking-[-0.03em]">{title}</h1>
      {intro && <p className="mt-4 text-[16px] text-neutral-600">{intro}</p>}
      <div className="mt-2">{events.length ? events.map((e) => <StoryRow key={e.id} e={e} lang={lang} iconName={tm.get(e.topic_ids[0])} />) : <p className="py-10 text-neutral-500">{t(lang, "noEvents")}</p>}</div>
    </div>
  );
}
