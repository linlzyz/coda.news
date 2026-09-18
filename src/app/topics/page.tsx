import Link from "@/components/LLink";
import { allTopics } from "@/lib/data";
import { Icon } from "@/components/Icons";
import { getLang, t, TOPIC_ZH } from "@/lib/i18n";
export const metadata = { title: "Topics" };
export default async function Page() {
  const [topics, l] = await Promise.all([allTopics(), getLang()]);
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{t(l, "topics")}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {topics.map((x) => (
          <Link key={x.id} href={`/topic/${x.slug}`} className="flex items-center gap-3 rounded-2xl p-5 font-medium hover:brightness-95" style={{ background: "#F4F5F7" }}>
            <span className="text-[#C2410C]"><Icon name={x.slug} size={26} /></span>{l === "zh" ? TOPIC_ZH[x.slug] : x.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
