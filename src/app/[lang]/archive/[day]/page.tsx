import { notFound } from "next/navigation";
import { eventsOnDay } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { alternates, CATEGORY_ZH, langFrom } from "@/lib/i18n";
import Link from "@/components/LLink";
export const revalidate = 600;
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
      <nav className="mt-3 flex gap-4 text-[13px]">
        <Link href={`/archive/${shift(day, -1)}`} className="text-[#C2410C] hover:underline">← {zh ? "前一天" : "Previous day"}</Link>
        {next <= today && <Link href={`/archive/${next}`} className="text-[#C2410C] hover:underline">{zh ? "后一天" : "Next day"} →</Link>}
      </nav>
    </header>
  );
  return <EventList lang={l} title={nice} header={header} events={events} />;
}
