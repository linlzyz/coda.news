import { listEvents } from "@/lib/data";
import { alternates, getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export async function generateMetadata() {
  const l = await getLang();
  return { title: t(l, "entertainment"), alternates: alternates("/entertainment", l) };
}
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "entertainment")} intro={t(l, "entIntro")} events={await listEvents({ category: "entertainment", limit: 60 })} />;
}
