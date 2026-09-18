import { listEvents } from "@/lib/data";
import { alternates, getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export async function generateMetadata() {
  const l = await getLang();
  return { title: t(l, "australia"), alternates: alternates("/australia", l) };
}
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "australia")} intro={t(l, "auIntro")} events={await listEvents({ region: "AU", order: "recent", limit: 60 })} />;
}
