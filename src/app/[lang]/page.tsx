import { dayLabel } from "@/lib/loc";
import { orgLd } from "@/lib/site";
import Link from "@/components/LLink";
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
import { Feed } from "@/components/Feed";
import { alternates, langFrom, t, type Lang } from "@/lib/i18n";
import { countryL, persp as perspL, summary, timeAgoL, title } from "@/lib/loc";
import { CategoryLabel } from "@/components/Pills";


export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { alternates: alternates("/", l), ...(l === "zh" ? { title: "coda.news · 一件事，全世界怎么看", description: "科技与经济大事，以及世界各国媒体如何报道。" } : {}) };
}

export const revalidate = 300;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const CATS = ["economy", "technology", "sport", "entertainment", "fashion", "travel", "automotive", "gaming"] as const;
  const [events, au, cn, topics, trending, cq, fq, ...byCat] = await Promise.all([
    listEvents({ limit: 50 }), listEvents({ region: "AU", order: "recent", limit: 20 }), listEvents({ region: "CN", order: "recent", limit: 20 }), allTopics(), trendingCompanies(10), crypto(), fx(),
    // each tab gets its own list, same as its section page (the main list is dominated by the biggest economy/tech stories)
    ...CATS.map((c) => listEvents({ category: c, limit: 20 })),
  ]);
  const [iq, rq] = await Promise.all([indices("indices"), indices("rates")]);
  const l = await langFrom(params);
  const persp = await getPerspectives(events.map((e) => e.id));
  const companies = await companyMap([...events, ...au, ...cn, ...byCat.flat()]);
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const multi = events.filter((e) => (persp.get(e.id)?.length ?? 0) >= 2);
  // headline: the most important multi-country story that still has new reports in the last 12 hours
  const fresh = multi.filter((e) => Date.now() - Date.parse(e.last_article_at) < 12 * 3600_000);
  const top = fresh[0] ?? multi[0] ?? events[0];
  const featured = multi.find((e) => e.id !== top?.id && e.image_url) ?? multi.find((e) => e.id !== top?.id);
  const divided = multi.filter((e) => e.id !== top?.id && e.id !== featured?.id)
    .sort((a, b) => new Set((persp.get(b.id) ?? []).map((p) => p.tone)).size - new Set((persp.get(a.id) ?? []).map((p) => p.tone)).size).slice(0, 4);
  const list = events.filter((e) => e.id !== top?.id).slice(0, 75);
  const inList = new Set(list.map((e) => e.id));
  const auOnly = au.filter((e) => !inList.has(e.id));
  const cnOnly = cn.filter((e) => !inList.has(e.id) && !auOnly.some((a) => a.id === e.id));
  const seen = new Set([...inList, ...auOnly.map((e) => e.id), ...cnOnly.map((e) => e.id)]);
  const regionTags = (e: { regions?: string[] }) => (e.regions?.length ?? 0) > 2 ? [] : [...(e.regions?.includes("AU") ? ["australia"] : []), ...(e.regions?.includes("CN") ? ["china"] : [])];
  const catOnly = byCat.flat().filter((e) => e.id !== top?.id && !seen.has(e.id) && (seen.add(e.id), true));
  const updated = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" }) + " AEST";

  const siteLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: "coda.news", url: "https://coda.news", publisher: { "@id": "https://coda.news/#org" },
      potentialAction: { "@type": "SearchAction", target: "https://coda.news/search?q={q}", "query-input": "required name=q" } },
    { "@id": "https://coda.news/#org", ...orgLd },
  ] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
      <AutoRefresh />
      <Ticker lang={l} />
      <div className="grid gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-7">
          {top ? <Hero e={top} perspectives={persp.get(top.id) ?? []} l={l} /> : <p className="rounded-3xl border border-dashed border-[#E5E7EB] p-10 text-center text-neutral-500">{t(l, "first")}</p>}

          {trending.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF0EB] px-3.5 py-2 text-[13px] font-semibold text-[#C2410C]"><Icon name="flame" size={15} />{t(l, "trending")}</span>
              {trending.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="shrink-0 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium hover:border-[#F0A57F]">{c.name}</Link>)}
            </div>
          )}

          <Feed title={t(l, "latest")} more={t(l, "loadMore")} disclaimer={t(l, "disclaimer")}
            tabs={(["all", "australia", "china", "economy", "technology", "sport", "entertainment", "fashion", "travel", "automotive", "gaming"] as const).map((k) => [t(l, k), k === "all" ? undefined : k])}
            items={[
              ...list.map((e) => ({ tags: [e.category, ...regionTags(e)], node: <NewsItem e={e} companies={companies} topics={topicMap} lang={l} />, day: dayLabel(e.last_article_at, l), at: Date.parse(e.last_article_at) })),
              ...auOnly.map((e) => ({ tags: [e.category, ...regionTags(e)], hideInAll: true, node: <NewsItem e={e} companies={companies} topics={topicMap} lang={l} />, day: dayLabel(e.last_article_at, l), at: Date.parse(e.last_article_at) })),
              ...cnOnly.map((e) => ({ tags: [e.category, ...regionTags(e)], hideInAll: true, node: <NewsItem e={e} companies={companies} topics={topicMap} lang={l} />, day: dayLabel(e.last_article_at, l), at: Date.parse(e.last_article_at) })),
              ...catOnly.map((e) => ({ tags: [e.category, ...regionTags(e)], hideInAll: true, node: <NewsItem e={e} companies={companies} topics={topicMap} lang={l} />, day: dayLabel(e.last_article_at, l), at: Date.parse(e.last_article_at) })),
            ]} />
        </div>

        <aside className="space-y-5">
          <Markets zh={l === "zh"} title={t(l, "markets")} empty={t(l, "marketsDown")} updated={updated} tabs={[{ label: t(l, "indices"), quotes: iq, note: `${t(l, "indicesNote")}${iq[0] ? " · " + iq[0].as_of : ""}` }, { label: t(l, "crypto"), quotes: cq, note: t(l, "cryptoNote") }, { label: t(l, "fx"), quotes: fq, note: t(l, "fxNote") }, { label: t(l, "rates"), quotes: rq, note: `${t(l, "indicesNote")}${rq[0] ? " · " + rq[0].as_of : ""}` }]} />
          <TopicsGrid topics={topics} lang={l} />
          {featured && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(l, "featured")}</h2>
              <Link href={`/event/${featured.slug}`} className="group mt-3 block">
                <Cover e={featured} className="aspect-[16/9] w-full rounded-xl" />
                <div className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.015em] group-hover:text-[#C2410C]">{title(featured, l)}</div>
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-neutral-600">{summary(featured, l)}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#F4F5F7] px-3 py-2 text-[13px] font-medium text-[#C2410C]">{t(l, "compareN", { n: featured.countries.length })} <Icon name="arrow" size={14} /></span>
              </Link>
            </section>
          )}
          {divided.length > 0 && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(l, "disagree")}</h2>
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
          <Newsletter lang={l} t={Object.fromEntries((["nlTitle", "nlText", "nlOk", "nlPlaceholder", "subscribe", "nlErr", "privacy"] as const).map((k) => [k, t(l, k)])) as Record<"nlTitle" | "nlText" | "nlOk" | "nlPlaceholder" | "subscribe" | "nlErr" | "privacy", string>} />
        </aside>
      </div>
    </>
  );
}

function Hero({ e, perspectives, l }: { e: EventRow; perspectives: Perspective[]; l: Lang }) {
  return (
    <section className="relative grid overflow-hidden rounded-3xl bg-[#F4F5F7] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="relative z-10 flex flex-col gap-4 p-7 sm:p-9">
        <div className="flex items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C2410C]">{t(l, "topStory")}</span><CategoryLabel category={e.category} lang={l} /></div>
        <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#16181D] sm:text-[40px]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, l)}</Link>
        </h1>
        {summary(e, l) && <p className="line-clamp-3 text-[15px] leading-relaxed text-neutral-600">{summary(e, l)}</p>}
        {perspectives.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {perspectives.slice(0, 4).map((p) => (
              <span key={p.country} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] shadow-[0_1px_2px_rgba(22,24,29,.06)]" title={countryL(p.country, l)}>
                <Flag code={p.country} size={11} /><span className="font-medium text-neutral-700">{perspL(p, l).framing}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-4 pt-2">
          <Link href={`/event/${e.slug}`} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#EA5514] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#D24A0F]">{t(l, "compare")} <Icon name="arrow" size={15} /></Link>
          <span className="text-[12px] text-neutral-500">{e.source_count} {t(l, "sources")} · {e.countries.length} {t(l, "countries")} · {timeAgoL(e.last_article_at, l)}</span>
        </div>
      </div>
      <Cover e={e} credit priority className="min-h-[220px] md:min-h-full" />
    </section>
  );
}
