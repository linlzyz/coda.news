import Link from "@/components/LLink";
import type { Topic } from "@/lib/data";
import { t, TOPIC_ZH, type Lang } from "@/lib/i18n";
import { Icon } from "./Icons";

export function TopicsGrid({ topics, lang }: { topics: Topic[]; lang: Lang }) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-center"><h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(lang, "topTopics")}</h2><Link href="/topics" className="ml-auto text-[12px] text-neutral-500 hover:text-[#C2410C]">{t(lang, "viewAll")} →</Link></div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {topics.slice(0, 9).map((x) => (
          <Link key={x.id} href={`/topic/${x.slug}`} className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl bg-[#F4F5F7] p-2 text-center text-[12px] font-medium text-[#16181D] hover:bg-[#ECEEF1]">
            <span className="text-[#C2410C]"><Icon name={x.slug} size={24} /></span>
            <span className="leading-tight">{lang === "zh" ? TOPIC_ZH[x.slug] : x.name.replace("Artificial Intelligence", "AI")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
