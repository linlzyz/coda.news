import { notFound } from "next/navigation";
import { getCompany, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
export default async function Page({ params }: PageProps<"/company/[slug]">) {
  const c = await getCompany((await params).slug);
  if (!c) notFound();
  return <EventList title={c.name} intro={c.description ?? `Every event involving ${c.name}, and how each country reported it.`} events={await listEvents({ companyId: c.id, order: "recent", limit: 60 })} />;
}
