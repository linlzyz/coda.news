import { listEvents } from "@/lib/data";
import { alternates, getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export async function generateMetadata() {
  const l = await getLang();
  return { title: t(l, "sport"), alternates: alternates("/sport", l) };
}
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "sport")} intro={t(l, "sportIntro")} events={await listEvents({ category: "sport", limit: 60 })} />;
}
