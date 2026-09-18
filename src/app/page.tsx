import Link from "next/link";
import { allTopics, companyMap, indices, getPerspectives, listEvents, trendingCompanies, type EventRow, type Perspective } from "@/lib/data";
import { crypto, fx } from "@/lib/markets";
import { Cover } from "@/components/Cover";
import { Flag, Flags } from "@/components/Flag";
import { Icon } from "@/components/Icons";
import { Markets } from "@/components/Markets";
import { NewsItem } from "@/components/NewsItem";
import { Newsletter } from "@/components/Newsletter";
import { TopicsGrid } from "@/components/TopicsGrid";
import { Ticker } from "@/components/Ticker";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getLang, t, type Lang } from "@/lib/i18n";
import { countryL, persp as perspL, summary, timeAgoL, title } from "@/lib/loc";
import { CategoryLabel } from "@/components/Pills";


export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const tab = sp.tab === "economy" || sp.tab === "technology" ? sp.tab : undefined;
  const [events, topics, trending, cq, fq] = await Promise.all([
    listEvents({ limit: 60 }), allTopics(), trendingCompanies(10), crypto(), fx(),
  ]);
  const iq = await indices();
  const l = await getLang();
  const persp = await getPerspectives(events.map((e) => e.id));
  const companies = await companyMap(events);
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const multi = events.filter((e) => (persp.get(e.id)?.length ?? 0) >= 2);
  const top = multi[0] ?? events[0];
  const featured = multi.find((e) => e.id !== top?.id && e.image_url) ?? multi.find((e) => e.id !== top?.id);
  const divided = multi.filter((e) => e.id !== top?.id && e.id !== featured?.id)
    .sort((a, b) => new Set((persp.get(b.id) ?? []).map((p) => p.tone)).size - new Set((persp.get(a.id) ?? []).map((p) => p.tone)).size).slice(0, 4);
  const list = events.filter((e) => e.id !== top?.id && (!tab || e.category === tab)).slice(0, 30);
  const updated = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" }) + " AEST";

  return (
    <>
      <AutoRefresh />
      <Ticker lang={l} />
      <div className="grid gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-7">
          {top ? <Hero e={top} perspectives={persp.get(top.id) ?? []} l={l} /> : <p className="rounded-3xl border border-dashed border-[#DDE6F1] p-10 text-center text-slate-500">{t(l, "first")}</p>}

          {trending.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#EEF4FB] px-3.5 py-2 text-[13px] font-semibold text-[#1560BD]"><Icon name="flame" size={15} />{t(l, "trending")}</span>
              {trending.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="shrink-0 rounded-full border border-[#DDE6F1] bg-white px-3.5 py-2 text-[13px] font-medium hover:border-[#8DB3E2]">{c.name}</Link>)}
            </div>
          )}

          <section>
            <div className="flex items-center gap-5 border-b border-[#DDE6F1]">
              <h2 className="whitespace-nowrap py-3 text-[22px] font-semibold tracking-[-0.02em]">{t(l, "latest")}</h2>
              <nav className="flex gap-1 text-[13px]">
                {([["all", "/", undefined], ["economy", "/?tab=economy", "economy"], ["technology", "/?tab=technology", "technology"]] as const).map(([k, h, v]) => {
                  const active = v === tab;
                  return <Link key={k} href={h} scroll={false} className={`border-b-2 px-3 py-3 font-medium ${active ? "border-[#1560BD] text-[#1560BD]" : "border-transparent text-slate-500 hover:text-[#0E1A2B]"}`}>{t(l, k)}</Link>;
                })}
              </nav>
            </div>
            {list.map((e) => <NewsItem key={e.id} e={e} companies={companies} topics={topicMap} lang={l} />)}
          </section>
        </div>

        <aside className="space-y-5">
          <Markets title={t(l, "markets")} empty={t(l, "marketsDown")} updated={updated} tabs={[{ label: t(l, "indices"), quotes: iq, note: `${t(l, "indicesNote")}${iq[0] ? " · " + iq[0].as_of : ""}` }, { label: t(l, "crypto"), quotes: cq, note: t(l, "cryptoNote") }, { label: t(l, "fx"), quotes: fq, note: t(l, "fxNote") }]} />
          <TopicsGrid topics={topics} lang={l} />
          {featured && (
            <section className="rounded-2xl border border-[#DDE6F1] bg-white p-5">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(l, "featured")}</h2>
              <Link href={`/event/${featured.slug}`} className="group mt-3 block">
                <Cover e={featured} className="aspect-[16/9] w-full rounded-xl" />
                <div className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.015em] group-hover:text-[#1560BD]">{title(featured, l)}</div>
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-slate-600">{summary(featured, l)}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#F3F6FA] px-3 py-2 text-[13px] font-medium text-[#1560BD]">{t(l, "compareN", { n: featured.countries.length })} <Icon name="arrow" size={14} /></span>
              </Link>
            </section>
          )}
          {divided.length > 0 && (
            <section className="rounded-2xl border border-[#DDE6F1] bg-white p-5">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(l, "disagree")}</h2>
              <div className="mt-2 divide-y divide-[#DDE6F1]">
                {divided.map((e) => (
                  <Link key={e.id} href={`/event/${e.slug}`} className="block py-3">
                    <div className="text-[14px] font-semibold leading-snug hover:text-[#1560BD]">{title(e, l)}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px] text-slate-500"><Flags codes={e.countries} max={6} size={11} />{e.countries.length} {t(l, "countries")}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <Newsletter lang={l} status={typeof sp.subscribed === "string" ? sp.subscribed : undefined} />
        </aside>
      </div>
    </>
  );
}

function Hero({ e, perspectives, l }: { e: EventRow; perspectives: Perspective[]; l: Lang }) {
  return (
    <section className="relative grid overflow-hidden rounded-3xl bg-[#F3F6FA] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="relative z-10 flex flex-col gap-4 p-7 sm:p-9">
        <div className="flex items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1560BD]">{t(l, "topStory")}</span><CategoryLabel category={e.category} lang={l} /></div>
        <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#0E1A2B] sm:text-[40px]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#1560BD]">{title(e, l)}</Link>
        </h1>
        {summary(e, l) && <p className="line-clamp-3 text-[15px] leading-relaxed text-slate-600">{summary(e, l)}</p>}
        {perspectives.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {perspectives.slice(0, 4).map((p) => (
              <span key={p.country} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] shadow-[0_1px_2px_rgba(14,26,43,.06)]" title={countryL(p.country, l)}>
                <Flag code={p.country} size={11} /><span className="font-medium text-slate-700">{perspL(p, l).framing}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-4 pt-2">
          <Link href={`/event/${e.slug}`} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#1560BD] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#0F4F9E]">{t(l, "compare")} <Icon name="arrow" size={15} /></Link>
          <span className="text-[12px] text-slate-500">{e.source_count} {t(l, "sources")} · {e.countries.length} {t(l, "countries")} · {timeAgoL(e.last_article_at, l)}</span>
        </div>
      </div>
      <Cover e={e} credit className="min-h-[220px] md:min-h-full" />
    </section>
  );
}
