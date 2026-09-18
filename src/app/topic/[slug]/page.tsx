import { notFound } from "next/navigation";
import { getTopic, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { getLang, TOPIC_ZH } from "@/lib/i18n";
export default async function Page({ params }: PageProps<"/topic/[slug]">) {
  const t = await getTopic((await params).slug);
  if (!t) notFound();
  const l = await getLang();
  return <EventList title={l === "zh" ? TOPIC_ZH[t.slug] ?? t.name : t.name} events={await listEvents({ topicId: t.id, limit: 60 })} />;
}
