import Link from "next/link";
import { allTopics, getPerspectives, indices, listEvents, trendingCompanies, type EventRow, type Perspective } from "@/lib/data";
import { crypto, fx } from "@/lib/markets";
import { getLang, t, TOPIC_ZH, type Lang } from "@/lib/i18n";
import { countryL, persp as perspL, summary, timeAgoL, title } from "@/lib/loc";
import { Cover } from "@/components/Cover";
import { Flag, Flags } from "@/components/Flag";
import { Markets } from "@/components/Markets";
import { Newsletter } from "@/components/Newsletter";
import { SectionHead } from "@/components/Section";
import { Meta, StoryCard, StoryRow } from "@/components/Story";
import { Ticker } from "@/components/Ticker";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const [events, topics, trending, iq, cq, fq, l] = await Promise.all([
    listEvents({ limit: 80 }), allTopics(), trendingCompanies(12), indices(), crypto(), fx(), getLang(),
  ]);
  const persp = await getPerspectives(events.map((e) => e.id));
  const topicSlug = new Map(topics.map((x) => [x.id, x.slug]));
  const icon = (e: EventRow) => topicSlug.get(e.topic_ids[0]);
  const nP = (e: EventRow) => persp.get(e.id)?.length ?? 0;

  const used = new Set<number>();
  const take = (list: EventRow[], n: number) => { const out = list.filter((e) => !used.has(e.id)).slice(0, n); out.forEach((e) => used.add(e.id)); return out; };
  const [lead] = take(events.filter((e) => nP(e) >= 2 && e.image_url).concat(events.filter((e) => nP(e) >= 2), events), 1);
  const latest = take([...events].sort((a, b) => +new Date(b.last_article_at) - +new Date(a.last_article_at)), 7);
  const divided = take(events.filter((e) => nP(e) >= 3).sort((a, b) => new Set((persp.get(b.id) ?? []).map((p) => p.tone)).size - new Set((persp.get(a.id) ?? []).map((p) => p.tone)).size || b.countries.length - a.countries.length), 4);
  const tech = take(events.filter((e) => e.category === "technology"), 4);
  const econ = take(events.filter((e) => e.category === "economy"), 4);
  const rest = take(events, 16);

  return (
    <>
      <AutoRefresh />
      <Ticker lang={l} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        {/* Lead + latest */}
        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          {lead ? <Lead e={lead} perspectives={persp.get(lead.id) ?? []} l={l} iconName={icon(lead)} /> : <p className="py-20 text-center text-neutral-500">{t(l, "first")}</p>}
          <aside className="lg:border-l lg:border-[#E6E6E6] lg:pl-10">
            <div className="border-t-2 border-[#111111] pt-2.5 text-[20px] font-semibold tracking-[-0.02em]">{t(l, "latestShort")}</div>
            <ol className="divide-y divide-[#E6E6E6]">
              {latest.map((e) => (
                <li key={e.id} className="py-3.5">
                  <div className="text-[12px] text-neutral-500">{timeAgoL(e.last_article_at, l)}</div>
                  <Link href={`/event/${e.slug}`} className="mt-1 block text-[15px] font-semibold leading-snug hover:text-[#C2410C]">{title(e, l)}</Link>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-[#E6E6E6] pt-3 text-[11px] leading-relaxed text-neutral-400">{t(l, "disclaimer")}</p>
          </aside>
        </div>

        {trending.length > 0 && (
          <div className="flex items-center gap-x-5 gap-y-2 overflow-x-auto border-y border-[#E6E6E6] py-3 text-[14px]">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2410C]">{t(l, "trending")}</span>
            {trending.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="shrink-0 font-medium text-neutral-700 hover:text-[#C2410C]">{c.name}</Link>)}
          </div>
        )}

        {divided.length > 0 && (
          <section className="py-10">
            <SectionHead title={t(l, "disagree")} />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {divided.map((e, i) => (
                <Link key={e.id} href={`/event/${e.slug}`} className="group block">
                  <div className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-[#EA5514]">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-3 text-[16px] font-semibold leading-snug group-hover:text-[#C2410C]">{title(e, l)}</div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                    {(persp.get(e.id) ?? []).slice(0, 4).map((p) => (
                      <span key={p.country} className="inline-flex items-center gap-1.5 text-[12px] text-neutral-600"><Flag code={p.country} size={10} />{perspL(p, l).framing}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-10 pb-4 lg:grid-cols-2">
          {tech.length > 0 && <section><SectionHead title={t(l, "technology")} href="/technology" more={t(l, "more")} /><div className="grid gap-8 sm:grid-cols-2">{tech.map((e) => <StoryCard key={e.id} e={e} lang={l} iconName={icon(e)} />)}</div></section>}
          {econ.length > 0 && <section><SectionHead title={t(l, "economy")} href="/economy" more={t(l, "more")} /><div className="grid gap-8 sm:grid-cols-2">{econ.map((e) => <StoryCard key={e.id} e={e} lang={l} iconName={icon(e)} />)}</div></section>}
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-3">
          <Markets title={t(l, "markets")} empty={t(l, "marketsDown")} tabs={[
            { label: t(l, "indices"), quotes: iq, note: `${t(l, "indicesNote")}${iq[0] ? " · " + iq[0].as_of : ""}` },
            { label: t(l, "crypto"), quotes: cq, note: t(l, "cryptoNote") },
            { label: t(l, "fx"), quotes: fq, note: t(l, "fxNote") },
          ]} />
          <section>
            <SectionHead title={t(l, "topics")} href="/topics" more={t(l, "viewAll")} />
            <ul className="grid grid-cols-2 gap-x-6">
              {topics.map((x) => <li key={x.id} className="border-b border-[#E6E6E6]"><Link href={`/topic/${x.slug}`} className="block py-2.5 text-[14px] font-medium hover:text-[#C2410C]">{l === "zh" ? TOPIC_ZH[x.slug] : x.name}</Link></li>)}
            </ul>
          </section>
          <Newsletter lang={l} status={typeof sp.subscribed === "string" ? sp.subscribed : undefined} />
        </div>

        {rest.length > 0 && (
          <section className="pt-4">
            <SectionHead title={t(l, "moreNews")} />
            <div className="grid gap-x-10 lg:grid-cols-2">{rest.map((e) => <StoryRow key={e.id} e={e} lang={l} iconName={icon(e)} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}

function Lead({ e, perspectives, l, iconName }: { e: EventRow; perspectives: Perspective[]; l: Lang; iconName?: string }) {
  return (
    <article className="min-w-0">
      <Link href={`/event/${e.slug}`} className="block"><Cover e={e} credit iconName={iconName} className="aspect-[16/9] w-full" /></Link>
      <div className="mt-5"><Meta e={e} lang={l} /></div>
      <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[42px]">
        <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, l)}</Link>
      </h1>
      {summary(e, l) && <p className="mt-3 max-w-[760px] text-[17px] leading-relaxed text-neutral-600">{summary(e, l)}</p>}
      {perspectives.length > 0 && (
        <div className="mt-6 border-t border-[#E6E6E6]">
          <div className="pt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2410C]">{t(l, "howEach")}</div>
          <ul className="divide-y divide-[#E6E6E6]">
            {perspectives.slice(0, 4).map((p) => {
              const v = perspL(p, l);
              return (
                <li key={p.country} className="grid grid-cols-[132px_minmax(0,1fr)] gap-4 py-3 text-[14px]">
                  <span className="inline-flex items-center gap-2 font-semibold"><Flag code={p.country} size={12} />{countryL(p.country, l)}</span>
                  <span className="text-neutral-600"><span className="font-medium text-[#111111]">{v.framing}.</span> {v.emphasis}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href={`/event/${e.slug}`} className="text-[15px] font-semibold text-[#111111] underline decoration-[#EA5514] decoration-2 underline-offset-[6px] hover:text-[#C2410C]">{t(l, "compare")} →</Link>
        <span className="text-[13px] text-neutral-500"><Flags codes={e.countries} max={8} size={10} /> {e.source_count} {t(l, "sources")} · {e.countries.length} {t(l, "countries")}</span>
      </div>
    </article>
  );
}
