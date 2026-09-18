import Link from "next/link";
import type { Topic } from "@/lib/data";
import { t, TOPIC_ZH, type Lang } from "@/lib/i18n";

export function TopicsGrid({ topics, lang }: { topics: Topic[]; lang: Lang }) {
  return (
    <section>
      <div className="flex items-baseline border-t-2 border-[#16181D] pt-2.5"><h2 className="text-[18px] font-semibold tracking-[-0.015em]">{t(lang, "topTopics")}</h2><Link href="/topics" className="ml-auto text-[12px] text-neutral-500 hover:text-[#C2410C]">{t(lang, "viewAll")} →</Link></div>
      <ul className="mt-1 grid grid-cols-2 gap-x-5">
        {topics.map((x) => (
          <li key={x.id} className="border-b border-[#E5E7EB]"><Link href={`/topic/${x.slug}`} className="block py-2.5 text-[14px] font-medium hover:text-[#C2410C]">{lang === "zh" ? TOPIC_ZH[x.slug] : x.name}</Link></li>
        ))}
      </ul>
    </section>
  );
}
