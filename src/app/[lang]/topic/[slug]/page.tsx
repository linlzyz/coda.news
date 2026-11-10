import { notFound } from "next/navigation";
import { getTopic, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { FollowBox } from "@/components/FollowBox";
import { alternates, langFrom, TOPIC_ZH } from "@/lib/i18n";
// Vercel cost (29 Oct 2026): crawlers open old pages one by one and every expired page is rebuilt (an ISR write).
export const revalidate = 604800;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;
export async function generateMetadata({ params }: PageProps<"/[lang]/topic/[slug]">) {
  const [x, l] = await Promise.all([getTopic((await params).slug), langFrom(params)]);
  if (!x) return {};
  const name = l === "zh" ? TOPIC_ZH[x.slug] ?? x.name : x.name;
  return {
    title: l === "zh" ? `${name}：最新新闻与各国媒体的不同讲法` : `${name}: latest news and how each country reports it`,
    description: l === "zh" ? `关于${name}的最新事件。coda.news 把各国媒体对同一件事的报道放在一起，看共同点和不同点。` : `The latest events on ${name.toLowerCase()}, with each country's coverage side by side: what every report shares and where they differ.`,
    alternates: alternates(`/topic/${x.slug}`, l),
  };
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
  return <EventList lang={l} title={name} header={header} events={await listEvents({ topicId: t.id, limit: 40 })} />;
}
