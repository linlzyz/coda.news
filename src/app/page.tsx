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
  const [iq, rq] = await Promise.all([indices("indices"), indices("rates")]);
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
          {top ? <Hero e={top} perspectives={persp.get(top.id) ?? []} l={l} /> : <p className="border border-dashed border-[#E5E7EB] p-10 text-center text-neutral-500">{t(l, "first")}</p>}

          {trending.length > 0 && (
            <div className="flex items-center gap-x-5 overflow-x-auto border-b border-[#E5E7EB] pb-3">
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2410C]">{t(l, "trending")}</span>
              {trending.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="shrink-0 text-[14px] font-medium text-neutral-700 hover:text-[#C2410C]">{c.name}</Link>)}
            </div>
          )}

          <section>
            <div className="flex items-center gap-5 border-b border-[#E5E7EB] border-t-2 border-t-[#16181D]">
              <h2 className="whitespace-nowrap py-3 text-[20px] font-semibold tracking-[-0.02em]">{t(l, "latest")}</h2>
              <nav className="flex gap-1 text-[13px]">
                {([["all", "/", undefined], ["economy", "/?tab=economy", "economy"], ["technology", "/?tab=technology", "technology"]] as const).map(([k, h, v]) => {
                  const active = v === tab;
                  return <Link key={k} href={h} scroll={false} className={`border-b-2 px-3 py-3 font-medium ${active ? "border-[#C2410C] text-[#C2410C]" : "border-transparent text-neutral-500 hover:text-[#16181D]"}`}>{t(l, k)}</Link>;
                })}
              </nav>
            </div>
            {list.map((e) => <NewsItem key={e.id} e={e} companies={companies} topics={topicMap} lang={l} />)}
            <p className="mt-4 text-[12px] leading-relaxed text-neutral-500">{t(l, "disclaimer")}</p>
          </section>
        </div>

        <aside className="space-y-9 xl:border-l xl:border-[#E5E7EB] xl:pl-8">
          <Markets title={t(l, "markets")} empty={t(l, "marketsDown")} updated={updated} tabs={[{ label: t(l, "indices"), quotes: iq, note: `${t(l, "indicesNote")}${iq[0] ? " · " + iq[0].as_of : ""}` }, { label: t(l, "crypto"), quotes: cq, note: t(l, "cryptoNote") }, { label: t(l, "fx"), quotes: fq, note: t(l, "fxNote") }, { label: t(l, "rates"), quotes: rq, note: `${t(l, "indicesNote")}${rq[0] ? " · " + rq[0].as_of : ""}` }]} />
          <TopicsGrid topics={topics} lang={l} />
          {featured && (
            <section>
              <h2 className="border-t-2 border-[#16181D] pt-2.5 text-[18px] font-semibold tracking-[-0.015em]">{t(l, "featured")}</h2>
              <Link href={`/event/${featured.slug}`} className="group mt-3 block">
                <Cover e={featured} className="aspect-[16/9] w-full" />
                <div className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.015em] group-hover:text-[#C2410C]">{title(featured, l)}</div>
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-neutral-600">{summary(featured, l)}</p>
                <span className="mt-2 inline-block text-[13px] font-semibold text-[#C2410C]">{t(l, "compareN", { n: featured.countries.length })} →</span>
              </Link>
            </section>
          )}
          {divided.length > 0 && (
            <section>
              <h2 className="border-t-2 border-[#16181D] pt-2.5 text-[18px] font-semibold tracking-[-0.015em]">{t(l, "disagree")}</h2>
              <div className="mt-2 divide-y divide-[#E5E7EB]">
                {divided.map((e) => (
                  <Link key={e.id} href={`/event/${e.slug}`} className="block py-3">
                    <div className="text-[14px] font-semibold leading-snug hover:text-[#C2410C]">{title(e, l)}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px] text-neutral-500"><Flags codes={e.countries} max={6} size={11} />{e.countries.length} {t(l, "countries")}</div>
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
    <section className="border-b border-[#E5E7EB] pb-7">
      <Link href={`/event/${e.slug}`} className="block"><Cover e={e} credit className="aspect-[16/9] w-full" /></Link>
      <div className="mt-5 flex flex-col">
        <div className="flex items-center gap-2.5"><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2410C]">{t(l, "topStory")}</span><CategoryLabel category={e.category} lang={l} /></div>
        <h1 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#16181D] sm:text-[40px]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, l)}</Link>
        </h1>
        {summary(e, l) && <p className="mt-3 line-clamp-3 max-w-[720px] text-[16px] leading-relaxed text-neutral-600">{summary(e, l)}</p>}
        {perspectives.length > 0 && (
          <ul className="mt-5 grid divide-y divide-[#E5E7EB] border-y border-[#E5E7EB] sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8">
            {perspectives.slice(0, 4).map((p) => (
              <li key={p.country} className="flex items-center gap-2.5 py-2.5 text-[13px] sm:border-b sm:border-[#E5E7EB]">
                <Flag code={p.country} size={11} /><span className="w-[118px] shrink-0 font-semibold">{countryL(p.country, l)}</span><span className="truncate text-neutral-600">{perspL(p, l).framing}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
          <Link href={`/event/${e.slug}`} className="text-[14px] font-semibold text-[#16181D] underline decoration-[#EA5514] decoration-2 underline-offset-[6px] hover:text-[#C2410C]">{t(l, "compare")} →</Link>
          <span className="text-[12px] text-neutral-500">{e.source_count} {t(l, "sources")} · {e.countries.length} {t(l, "countries")} · {timeAgoL(e.last_article_at, l)}</span>
        </div>
      </div>
    </section>
  );
}
