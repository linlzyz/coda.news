import { notFound } from "next/navigation";
import { getCompany, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { langFrom } from "@/lib/i18n";
export const revalidate = 300;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;
export async function generateMetadata({ params }: PageProps<"/[lang]/company/[slug]">) {
  const c = await getCompany((await params).slug);
  return c ? { title: c.name } : {};
}
export default async function Page({ params }: PageProps<"/[lang]/company/[slug]">) {
  const c = await getCompany((await params).slug);
  if (!c) notFound();
  const l = await langFrom(params);
  return <EventList lang={l} title={c.name} intro={c.description ?? (l === "zh" ? `与 ${c.name} 相关的所有事件，以及各国如何报道。` : `Every event involving ${c.name}, and how each country reported it.`)} events={await listEvents({ companyId: c.id, order: "recent", limit: 60 })} />;
}
