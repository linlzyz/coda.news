import { listEvents } from "@/lib/data";
import { getLang, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
export const metadata = { title: "Technology" };
export default async function Page() {
  const l = await getLang();
  return <EventList title={t(l, "technology")} intro={t(l, "techIntro")} events={await listEvents({ category: "technology", limit: 60 })} />;
}
