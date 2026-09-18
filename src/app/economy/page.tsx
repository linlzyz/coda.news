import { listEvents } from "@/lib/data";
import { alternates, getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export async function generateMetadata() {
  const l = await getLang();
  return { title: t(l, "economy"), alternates: alternates("/economy", l) };
}
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "economy")} intro={t(l, "econIntro")} events={await listEvents({ category: "economy", limit: 60 })} />;
}
