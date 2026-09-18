import { notFound } from "next/navigation";
import { getTopic, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
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
  return <EventList lang={l} title={l === "zh" ? TOPIC_ZH[t.slug] ?? t.name : t.name} events={await listEvents({ topicId: t.id, limit: 60 })} />;
}
