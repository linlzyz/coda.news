import Link from "next/link";
import { allTopics } from "@/lib/data";
import { getLang, t, TOPIC_ZH } from "@/lib/i18n";
export const metadata = { title: "Topics" };
export default async function Page() {
  const [topics, l] = await Promise.all([allTopics(), getLang()]);
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="border-b-2 border-[#111111] pb-4 text-[40px] font-semibold tracking-[-0.03em]">{t(l, "topics")}</h1>
      <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
        {topics.map((x) => (
          <li key={x.id} className="border-b border-[#E6E6E6]"><Link href={`/topic/${x.slug}`} className="flex items-center justify-between py-4 text-[17px] font-semibold hover:text-[#C2410C]">{l === "zh" ? TOPIC_ZH[x.slug] : x.name}<span className="text-neutral-400">→</span></Link></li>
        ))}
      </ul>
    </div>
  );
}
