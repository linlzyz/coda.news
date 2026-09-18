import Link from "next/link";
import { allTopics, getPerspectives, listEvents, stats, type EventRow } from "@/lib/data";
import { countryName, timeAgo, TONE } from "@/lib/ui";
import { EventCard, EventMeta, EventMini } from "@/components/EventCard";
import { Flag } from "@/components/Flag";
import { CategoryLabel } from "@/components/Pills";
import { Ticker } from "@/components/Ticker";
import { AutoRefresh } from "@/components/AutoRefresh";

export const revalidate = 60;

export default async function Home() {
  const [events, topics, s] = await Promise.all([listEvents({ limit: 40 }), allTopics(), stats()]);
  const persp = await getPerspectives(events.slice(0, 40).map((e) => e.id));
  // Top story: most important event that already has 2+ country perspectives, else the most important
  const top = events.find((e) => (persp.get(e.id)?.length ?? 0) >= 2) ?? events[0];
  const rest = events.filter((e) => e.id !== top?.id);
  const divided = events
    .map((e) => ({ e, tones: new Set((persp.get(e.id) ?? []).map((p) => p.tone)).size, n: persp.get(e.id)?.length ?? 0 }))
    .filter((x) => x.n >= 2).sort((a, b) => b.tones - a.tones || b.n - a.n).slice(0, 4);

  return (
    <>
      <AutoRefresh />
      <Ticker />
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          {top ? <TopStory e={top} perspectives={persp.get(top.id) ?? []} /> : <Empty />}
          <section>
            <div className="flex items-center gap-4 overflow-x-auto border-b border-[#D6E2F5] pb-3">
              <h2 className="whitespace-nowrap text-xl font-bold tracking-[-0.01em]">Latest events</h2>
              <div className="flex gap-1 text-sm">
                <span className="rounded-lg bg-[#EAF1FE] px-3 py-1.5 font-semibold text-[#1D4ED8]">All</span>
                <Link href="/technology" className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">Technology</Link>
                <Link href="/economy" className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">Economy</Link>
              </div>
            </div>
            {rest.map((e) => <EventCard key={e.id} e={e} />)}
          </section>
        </div>

        <aside className="space-y-6">
          {divided.length > 0 && (
            <section className="rounded-2xl border border-[#D6E2F5] p-5">
              <h2 className="text-base font-bold">Where the world disagrees</h2>
              <p className="mt-1 text-sm text-slate-500">Events where countries frame the story most differently.</p>
              <div className="-mx-3 mt-3">{divided.map(({ e }) => <EventMini key={e.id} e={e} />)}</div>
            </section>
          )}
          <section className="rounded-2xl border border-[#D6E2F5] p-5">
            <h2 className="text-base font-bold">Topics</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topics.map((t) => (
                <Link key={t.id} href={`/topic/${t.slug}`} className="inline-flex items-center gap-2 rounded-full border border-[#D6E2F5] px-3 py-1.5 text-sm hover:border-[#7FA3E8]">
                  <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />{t.name}
                </Link>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-[#0A1A33] p-5 text-white">
            <h2 className="text-base font-bold">A knowledge base that updates itself</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Every 5 minutes coda.news reads {s.sources} newsrooms across the world, links every article to its event, and records the facts.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3"><div className="text-2xl font-bold">{s.events}</div><div className="text-xs text-slate-300">events</div></div>
              <div className="rounded-xl bg-white/10 p-3"><div className="text-2xl font-bold">{s.sources}</div><div className="text-xs text-slate-300">sources</div></div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function TopStory({ e, perspectives }: { e: EventRow; perspectives: Awaited<ReturnType<typeof getPerspectives>> extends Map<number, infer P> ? P : never }) {
  return (
    <section className="grid overflow-hidden rounded-3xl bg-[#0A1A33] text-white lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5 p-7 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#8FB4FF]">Top story · <CategoryLabel category={e.category} /></div>
        <h1 className="text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#8FB4FF]">{e.title}</Link>
        </h1>
        {e.summary && <p className="text-[15px] leading-relaxed text-slate-300">{e.summary}</p>}
        <EventMeta e={e} dark />
        <div className="mt-auto flex items-center gap-4">
          <Link href={`/event/${e.slug}`} className="rounded-xl bg-[#EA5514] px-5 py-3 text-sm font-semibold text-white hover:bg-[#D24A0F]">Compare the coverage →</Link>
          <span className="text-xs text-slate-400">Updated {timeAgo(e.last_article_at)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 bg-white/[0.06] p-6 sm:p-7">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">How the world reports it</div>
        {perspectives.length === 0 && <p className="text-sm text-slate-400">Perspectives appear as soon as media in a second country cover this event.</p>}
        {perspectives.slice(0, 5).map((p) => (
          <div key={p.country} className="rounded-2xl bg-white/[0.07] p-4">
            <div className="flex items-center gap-2.5">
              <Flag code={p.country} size={14} />
              <span className="text-sm font-semibold">{countryName(p.country)}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[p.tone]?.cls ?? ""}`}>{p.framing ?? TONE[p.tone]?.label}</span>
            </div>
            {p.emphasis && <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{p.emphasis}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Empty() {
  return <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">The first events are being assembled. Check back in a few minutes.</div>;
}
