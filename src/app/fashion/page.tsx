import { listEvents } from "@/lib/data";
import { alternates, getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export async function generateMetadata() {
  const l = await getLang();
  return { title: t(l, "fashion"), alternates: alternates("/fashion", l) };
}
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "fashion")} intro={t(l, "fashionIntro")} events={await listEvents({ category: "fashion", limit: 60 })} />;
}
