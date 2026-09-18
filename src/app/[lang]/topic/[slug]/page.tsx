import { notFound } from "next/navigation";
import { getTopic, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { FollowBox } from "@/components/FollowBox";
import { langFrom, TOPIC_ZH } from "@/lib/i18n";
export const revalidate = 120;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;
export async function generateMetadata({ params }: PageProps<"/[lang]/topic/[slug]">) {
  const [x, l] = await Promise.all([getTopic((await params).slug), langFrom(params)]);
  return x ? { title: l === "zh" ? TOPIC_ZH[x.slug] ?? x.name : x.name } : {};
}
export default async function Page({ params }: PageProps<"/[lang]/topic/[slug]">) {
  const t = await getTopic((await params).slug);
  if (!t) notFound();
  const l = await langFrom(params);
  const name = l === "zh" ? TOPIC_ZH[t.slug] ?? t.name : t.name;
  const header = (<header>
    <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{name}</h1>
    <div className="mt-4"><FollowBox name={name} lang={l} topicId={t.id} /></div>
  </header>);
  return <EventList lang={l} title={name} header={header} events={await listEvents({ topicId: t.id, limit: 60 })} />;
}
