import { listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
export const revalidate = 60;
export const metadata = { title: "Economy" };
export default async function Page() {
  return <EventList title="Economy" intro="Rates, trade, markets and companies, compared across countries." events={await listEvents({ category: "economy", limit: 60 })} />;
}
