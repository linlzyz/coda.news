import { listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
export const revalidate = 60;
export const metadata = { title: "Technology" };
export default async function Page() {
  return <EventList title="Technology" intro="AI, chips, big tech and startups, compared across countries." events={await listEvents({ category: "technology", limit: 60 })} />;
}
