import { listEvents } from "@/lib/data";
import { alternates, langFrom, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: t(l, "economy"), alternates: alternates("/economy", l) };
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return <EventList lang={l} title={t(l, "economy")} intro={t(l, "econIntro")} events={await listEvents({ category: "economy", limit: 60 })} />;
}
