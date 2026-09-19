import { notFound } from "next/navigation";
import { eventsOnDay, getPerspectives } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { alternates, CATEGORY_ZH, langFrom } from "@/lib/i18n";
import Link from "@/components/LLink";
export const revalidate = 3600;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;

const valid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
const shift = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

export async function generateMetadata({ params }: { params: Promise<{ lang: string; day: string }> }) {
  const { day } = await params; const l = await langFrom(params);
  if (!valid(day)) return {};
  const nice = new Date(`${day}T12:00:00Z`).toLocaleDateString(l === "zh" ? "zh-CN" : "en-AU", { day: "numeric", month: "long", year: "numeric" });
  return { title: l === "zh" ? `${nice}的新闻` : `News on ${nice}`, description: l === "zh" ? `${nice}全球科技、经济、体育、娱乐和时尚事件，以及各国媒体如何报道。` : `Technology, economy, sport, entertainment and fashion events on ${nice}, and how media in each country reported them.`, alternates: alternates(`/archive/${day}`, l) };
}

export default async function Page({ params }: { params: Promise<{ lang: string; day: string }> }) {
  const { day } = await params; const l = await langFrom(params); const zh = l === "zh";
  if (!valid(day)) notFound();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  if (day > today) notFound();
  const events = await eventsOnDay(day);
  // the day's brief: top stories covered by at least two countries
  const persp = await getPerspectives(events.slice(0, 60).map((e) => e.id));
  const brief = events.filter((e) => (persp.get(e.id)?.length ?? 0) >= 2).slice(0, 5);
  const nice = new Date(`${day}T12:00:00Z`).toLocaleDateString(zh ? "zh-CN" : "en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const cats = new Map<string, number>(); for (const e of events) cats.set(e.category, (cats.get(e.category) ?? 0) + 1);
  const next = shift(day, 1);
  const header = (
    <header>
      <Link href="/archive" className="text-[13px] text-neutral-500 hover:text-[#C2410C]">← {zh ? "新闻归档" : "Archive"}</Link>
      <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.03em]">{nice}</h1>
      <p className="mt-2 text-[15px] text-neutral-600">
        {zh ? `共 ${events.length} 个事件` : `${events.length} ${events.length === 1 ? "event" : "events"}`}
        {cats.size > 0 && " · " + [...cats.entries()].map(([c, n]) => `${zh ? CATEGORY_ZH[c] ?? c : c[0].toUpperCase() + c.slice(1)} ${n}`).join(" · ")}
      </p>
      <nav className="mt-4 flex flex-wrap items-center gap-2 text-[13px]" aria-label={zh ? "按日期查看" : "Pick a day"}>
        <Link href={`/archive/${shift(day, -1)}`} className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-600 hover:border-[#EA5514] hover:text-[#C2410C]" aria-label={zh ? "前一天" : "Previous day"}>←</Link>
        {Array.from({ length: 7 }, (_, i) => shift(today, -i)).reverse().map((d) => {
          const dt = new Date(`${d}T12:00:00Z`);
          const label = d === today ? (zh ? "今天" : "Today") : zh ? `${dt.getUTCMonth() + 1}月${dt.getUTCDate()}日` : dt.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
          return d === day
            ? <span key={d} className="rounded-full bg-[#EA5514] px-3 py-1.5 font-semibold text-white">{label}</span>
            : <Link key={d} href={`/archive/${d}`} className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:border-[#EA5514] hover:text-[#C2410C]">{label}</Link>;
        })}
        {next <= today && <Link href={`/archive/${next}`} className="rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-600 hover:border-[#EA5514] hover:text-[#C2410C]" aria-label={zh ? "后一天" : "Next day"}>→</Link>}
        <Link href="/archive" className="ml-1 text-neutral-500 hover:text-[#C2410C]">{zh ? "全部日期" : "All days"}</Link>
      </nav>
      {brief.length > 0 && (
        <section className="mt-6 rounded-2xl bg-[#1F2328] p-5 text-white">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#F0A57F]">{zh ? "当日简报" : "Daily brief"}</h2>
          <ol className="mt-3 space-y-3">
            {brief.map((e, i) => (
              <li key={e.id} className="flex gap-3">
                <span className="text-[20px] font-semibold text-[#EA5514]">{i + 1}</span>
                <div>
                  <Link href={`/event/${e.slug}`} className="text-[16px] font-semibold leading-snug hover:underline">{(zh && e.title_zh) || e.title}</Link>
                  <p className="mt-0.5 text-[13px] text-neutral-300">{zh ? `${(persp.get(e.id) ?? []).length} 个国家报道` : `Reported by ${(persp.get(e.id) ?? []).length} countries`}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/#newsletter" className="mt-4 inline-block text-[13px] font-medium text-[#F0A57F] hover:underline">{zh ? "每天早上 7 点收到简报 →" : "Get the brief at 7am every day →"}</Link>
        </section>
      )}
    </header>
  );
  return <EventList lang={l} title={nice} header={header} events={events} />;
}
