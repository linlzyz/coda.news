import { listEvents } from "@/lib/data";
import { alternates, langFrom, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export const revalidate = 3600;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: t(l, "technology"), alternates: alternates("/technology", l) };
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return <EventList lang={l} title={t(l, "technology")} intro={t(l, "techIntro")} events={await listEvents({ category: "technology", limit: 60 })} />;
}
