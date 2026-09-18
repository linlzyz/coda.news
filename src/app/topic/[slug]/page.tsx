import { notFound } from "next/navigation";
import { getTopic, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
export const revalidate = 300;
export async function generateStaticParams() { return []; }
export default async function Page({ params }: PageProps<"/topic/[slug]">) {
  const t = await getTopic((await params).slug);
  if (!t) notFound();
  return <EventList title={t.name} events={await listEvents({ topicId: t.id, limit: 60 })} />;
}
