import { listEvents } from "@/lib/data";
import { alternates, langFrom, t } from "@/lib/i18n";
import { EventList } from "@/components/EventList";
// Vercel cost (Lyn, 29 Oct 2026): section lists rebuild every 6 hours
export const revalidate = 21600;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: t(l, "travel"), alternates: alternates("/travel", l) };
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return <EventList lang={l} title={t(l, "travel")} intro={t(l, "travelIntro")} events={await listEvents({ category: "travel", limit: 60 })} />;
}
