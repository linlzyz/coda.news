import { listEvents } from "@/lib/data";
import { alternates, getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export async function generateMetadata() {
  const l = await getLang();
  return { title: t(l, "technology"), alternates: alternates("/technology", l) };
}
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "technology")} intro={t(l, "techIntro")} events={await listEvents({ category: "technology", limit: 60 })} />;
}
