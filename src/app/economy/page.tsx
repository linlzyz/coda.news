import { listEvents } from "@/lib/data";
import { getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export const metadata = { title: "Economy" };
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "economy")} intro={t(l, "econIntro")} events={await listEvents({ category: "economy", limit: 60 })} />;
}
