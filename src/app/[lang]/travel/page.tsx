import { listEvents } from "@/lib/data";
import { alternates, langFrom, t } from "@/lib/i18n";
import { MagazineGrid } from "@/components/NewsItem";
export const revalidate = 900;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: t(l, "travel"), alternates: alternates("/travel", l) };
}
// travel reads like a magazine: new hotels, destinations and guides as a picture grid
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  const events = (await listEvents({ category: "travel", order: "recent", limit: 60 })).sort((a, b) => Number(!!b.image_url) - Number(!!a.image_url));
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <h1 className="text-[40px] font-semibold tracking-[-0.03em]">{t(l, "travel")}</h1>
      <p className="mt-2 max-w-[680px] text-[16px] text-neutral-600">{t(l, "travelIntro")}</p>
      <div className="mt-8">{events.length ? <MagazineGrid events={events} lang={l} /> : <p className="py-10 text-neutral-500">{t(l, "noEvents")}</p>}</div>
    </div>
  );
}
