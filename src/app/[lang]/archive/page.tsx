import { archiveDays } from "@/lib/data";
import { alternates, langFrom } from "@/lib/i18n";
import Link from "@/components/LLink";
export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: l === "zh" ? "新闻归档" : "Archive", description: l === "zh" ? "按日期浏览 coda.news 的全部事件。" : "Browse every coda.news event by date.", alternates: alternates("/archive", l) };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params); const zh = l === "zh";
  const days = await archiveDays(120);
  const months = new Map<string, [string, number][]>();
  for (const d of days) { const m = d[0].slice(0, 7); months.set(m, [...(months.get(m) ?? []), d]); }
  const label = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString(zh ? "zh-CN" : "en-AU", { weekday: "short", day: "numeric", month: zh ? "long" : "short" });
  const mlabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(zh ? "zh-CN" : "en-AU", { month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
      <h1 className="text-[40px] font-semibold tracking-[-0.03em]">{zh ? "新闻归档" : "Archive"}</h1>
      <p className="mt-3 text-[16px] text-neutral-600">{zh ? "按日期（墨尔本时间）浏览每天的事件。" : "Every day's events, by date (Melbourne time)."}</p>
      {[...months.entries()].map(([m, list]) => (
        <section key={m} className="mt-8">
          <h2 className="text-[18px] font-semibold">{mlabel(m)}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {list.map(([day, n]) => (
              <Link key={day} href={`/archive/${day}`} className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 hover:border-[#F0A57F]">
                <div className="text-[14px] font-medium">{label(day)}</div>
                <div className="text-[12px] text-neutral-500">{n} {zh ? "个事件" : n === 1 ? "event" : "events"}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
